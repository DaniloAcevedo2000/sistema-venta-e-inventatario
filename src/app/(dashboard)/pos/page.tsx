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

  const [
    categorias,
    productos,
    tasaCambio,
    metodosPago,
    bancos,
    redesTarjeta,
    sesionCajaAbierta,  // ← NUEVA QUERY
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
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    }),
    obtenerTasaCambio(),
    obtenerMetodosPago(),
    obtenerBancos(),
    obtenerRedesTarjeta(),
    // Buscar la sesión de caja abierta del usuario actual
    prisma.sesionCaja.findFirst({
      where: {
        usuarioAperturaId: session.user.id,
        estado: 'ABIERTA',
      },
      include: {
        caja: { select: { id: true, codigo: true, nombre: true } },
      },
    }),
  ])

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
  }))

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