import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PosInterface } from './pos-interface'
import {
  obtenerTasaCambio,
  obtenerMetodosPago,
  obtenerBancos,
  obtenerRedesTarjeta,
} from '@/lib/config-pagos'

export const metadata = {
  title: 'POS | Momoto Café',
}

export default async function PosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('ventas:crear')) redirect('/dashboard')

  if (!session.user.sucursalId) {
    return <div>Usuario sin sucursal asignada</div>
  }

  const sucursalId = session.user.sucursalId

  const [
    categorias,
    productos,
    tasaCambio,
    metodosPago,
    bancos,
    redesTarjeta,
    sesionCajaAbierta,
    clientes,
    stocks,
  ] = await Promise.all([
    prisma.categoria.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    }),
    prisma.producto.findMany({
      where: { activo: true },
      include: {
        categoria: { select: { id: true, nombre: true } },
        variantes: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
        // 👇 Receta con sus insumos para calcular stock efectivo
        receta: {
          include: {
            items: {
              select: {
                insumoId: true,
                cantidad: true,
                mermaPorcentaje: true,
              },
            },
          },
        },
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    }),
    obtenerTasaCambio(),
    obtenerMetodosPago(),
    obtenerBancos(),
    obtenerRedesTarjeta(),
    prisma.sesionCaja.findFirst({
      where: {
        usuarioAperturaId: session.user.id,
        estado: 'ABIERTA',
      },
      include: {
        caja: { select: { id: true, codigo: true, nombre: true } },
      },
    }),
    prisma.cliente.findMany({
      where: { activo: true, permiteCredito: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        apellido: true,
        nombreComercial: true,
        tipoDocumento: true,
        numeroDocumento: true,
        telefono: true,
        limiteCredito: true,
        saldoActual: true,
      },
      orderBy: { nombre: 'asc' },
      take: 500,
    }),
    // 👇 Stock de la sucursal (productos + insumos)
    prisma.stock.findMany({
      where: { sucursalId },
      select: {
        productoId: true,
        insumoId: true,
        cantidad: true,
      },
    }),
  ])

  // ============================================
  // MAPA DE STOCK
  // ============================================
  const stockPorProducto = new Map<string, number>()
  const stockPorInsumo = new Map<string, number>()
  for (const s of stocks) {
    const cant = Number(s.cantidad)
    if (s.productoId) stockPorProducto.set(s.productoId, cant)
    if (s.insumoId) stockPorInsumo.set(s.insumoId, cant)
  }

  // ============================================
  // STOCK EFECTIVO POR PRODUCTO
  // ============================================
  /**
   * - Producto con receta → mínimo de (stock_insumo / cantidad_por_unidad)
   * - Producto sin receta → stock directo del producto
   * - Sin fila en stocks → 0 (agotado)
   */
  function calcularStockEfectivo(p: (typeof productos)[number]): number {
    const receta = p.receta
    if (receta && receta.activa && receta.items.length > 0) {
      let minUnidades = Infinity
      for (const item of receta.items) {
        const stockInsumo = stockPorInsumo.get(item.insumoId) ?? 0
        const cantidadPorUnidad =
          Number(item.cantidad) * (1 + Number(item.mermaPorcentaje) / 100)

        if (cantidadPorUnidad <= 0) continue

        const unidadesPosibles = stockInsumo / cantidadPorUnidad
        if (unidadesPosibles < minUnidades) minUnidades = unidadesPosibles
      }
      return minUnidades === Infinity ? 0 : Math.floor(minUnidades)
    }

    const stock = stockPorProducto.get(p.id) ?? 0
    return Math.floor(stock)
  }

  const productosSerializados = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    precioBase: p.precioBase.toString(),
    tipo: p.tipo,
    tipoImpuesto: p.tipoImpuesto,
    imagenUrl: p.imagenUrl,
    color: p.color,
    destacado: p.destacado,
    permiteDescuento: p.permiteDescuento,
    categoriaId: p.categoriaId,
    categoriaNombre: p.categoria.nombre,
    variantes: p.variantes.map((v) => ({
      id: v.id,
      codigo: v.codigo,
      nombre: v.nombre,
      precio: v.precio.toString(),
      orden: v.orden,
    })),
    stockDisponible: calcularStockEfectivo(p),
    tieneReceta: !!p.receta && p.receta.activa,
  }))

  // 👇 Mapa productoId → stockDisponible para el carrito
  const stockPorProductoId: Record<string, number> = {}
  for (const p of productosSerializados) {
    stockPorProductoId[p.id] = p.stockDisponible
  }

  const usuario = {
    id: session.user.id,
    nombre: session.user.nombre,
    sucursalId: session.user.sucursalId,
    sucursalNombre: session.user.sucursalNombre,
    permisos: session.user.permisos,
  }

  const metodosPagoSerializados = metodosPago.map((m) => ({
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    tipo: m.tipo,
    requiereBanco: m.requiereBanco,
    requiereRed: m.requiereRed,
    requiereReferencia: m.requiereReferencia,
    esCredito: m.esCredito,
    icono: m.icono,
    monedaCodigo: m.moneda?.codigo ?? 'NIO',
    monedaSimbolo: m.moneda?.simbolo ?? 'C$',
  }))

  const bancosSerializados = bancos.map((b) => ({
    id: b.id,
    codigo: b.codigo,
    nombre: b.nombre,
    nombreCorto: b.nombreCorto,
  }))

  const redesSerializadas = redesTarjeta.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
  }))

  const clientesSerializados = clientes.map((c) => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    apellido: c.apellido,
    nombreComercial: c.nombreComercial,
    tipoDocumento: c.tipoDocumento,
    numeroDocumento: c.numeroDocumento,
    telefono: c.telefono,
    limiteCredito: Number(c.limiteCredito),
    saldoActual: Number(c.saldoActual),
    creditoDisponible: Number(c.limiteCredito) - Number(c.saldoActual),
  }))

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <PosInterface
        categorias={categorias.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          icono: c.icono,
          color: c.color,
          padreId: c.padreId,
        }))}
        productos={productosSerializados}
        usuario={usuario}
        tasaCambio={tasaCambio}
        metodosPago={metodosPagoSerializados}
        bancos={bancosSerializados}
        redesTarjeta={redesSerializadas}
        clientes={clientesSerializados}
        stockPorProductoId={stockPorProductoId}
        sesionCajaAbierta={
          sesionCajaAbierta
            ? {
                id: sesionCajaAbierta.id,
                cajaNombre: sesionCajaAbierta.caja.nombre,
                cajaCodigo: sesionCajaAbierta.caja.codigo,
                fechaApertura: sesionCajaAbierta.fechaApertura.toISOString(),
                montoInicial: Number(sesionCajaAbierta.montoInicial),
              }
            : null
        }
      />
    </div>
  )
}