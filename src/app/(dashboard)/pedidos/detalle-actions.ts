'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCoordsNegocio } from '@/lib/helpers/negocio'

export async function getPedidoDetalle(pedidoId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      sucursal: { select: { nombre: true } },
      zonaEntrega: { select: { nombre: true } },
      repartidor: { select: { id: true, nombre: true } },
      usuarioCreacion: { select: { nombre: true } },
      usuarioFacturacion: { select: { nombre: true } },
      venta: { select: { id: true, numero: true } },
      items: true,
    },
  })

  if (!pedido) throw new Error('Pedido no encontrado')

  const { latitudNegocio, longitudNegocio } = await getCoordsNegocio()

  // Factura ligada al pedido (si está facturado)
  let facturaNumero: string | null = null
  if (pedido.ventaId) {
    const factura = await prisma.factura.findUnique({
      where: { ventaId: pedido.ventaId },
      select: { numeroCompleto: true },
    })
    facturaNumero = factura?.numeroCompleto ?? null
  }

  return {
    id: pedido.id,
    numero: pedido.numero,
    tipo: pedido.tipo,
    estado: pedido.estado,
    estadoPago: pedido.estadoPago,
    clienteId: pedido.clienteId,
    clienteNombre: pedido.clienteNombre,
    clienteTelefono: pedido.clienteTelefono,
    clienteDireccion: pedido.clienteDireccion,
    zonaNombre: pedido.zonaEntrega?.nombre ?? null,
    sucursalNombre: pedido.sucursal.nombre,
    repartidorNombre: pedido.repartidor?.nombre ?? null,
    repartidorId: pedido.repartidorId,
    creadoPor: pedido.usuarioCreacion.nombre,
    facturadoPor: pedido.usuarioFacturacion?.nombre ?? null,
    subtotal: Number(pedido.subtotal),
    descuento: Number(pedido.descuento),
    impuesto: Number(pedido.impuesto),
    costoEnvio: Number(pedido.costoEnvio),
    total: Number(pedido.total),
    notas: pedido.notas,
    notasInternas: pedido.notasInternas,
    creadoEn: pedido.creadoEn.toISOString(),
    confirmadoEn: pedido.confirmadoEn?.toISOString() ?? null,
    preparacionEn: pedido.preparacionEn?.toISOString() ?? null,
    listoEn: pedido.listoEn?.toISOString() ?? null,
    enCaminoEn: pedido.enCaminoEn?.toISOString() ?? null,
    entregadoEn: pedido.entregadoEn?.toISOString() ?? null,
    canceladoEn: pedido.canceladoEn?.toISOString() ?? null,
    motivoCancelacion: pedido.motivoCancelacion,
    facturadoEn: pedido.facturadoEn?.toISOString() ?? null,
    ventaNumero: pedido.venta?.numero ?? null,
    facturaNumero,

    // Coordenadas
    latitud: pedido.latitud ?? null,
    longitud: pedido.longitud ?? null,
    latitudNegocio,
    longitudNegocio,

    items: pedido.items.map((item) => ({
      id: item.id,
      nombreProducto: item.nombreProducto,
      nombreVariante: item.nombreVariante,
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      total: Number(item.total),
      notas: item.notas,
    })),
  }
}

export async function getRepartidoresDisponibles() {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  return await prisma.usuario.findMany({
    where: {
      activo: true,
      roles: {
        some: { rol: { codigo: 'REPARTIDOR' } },
      },
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })
}

export async function getDatosPago() {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const [metodosPago, bancos, redesTarjeta] = await Promise.all([
    prisma.metodoPago.findMany({
      where: { activo: true },
      include: { moneda: true },
      orderBy: { orden: 'asc' },
    }),
    prisma.banco.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    }),
    prisma.redTarjeta.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    }),
  ])

  return {
    metodosPago: metodosPago.map((m) => ({
      id: m.id,
      codigo: m.codigo,
      nombre: m.nombre,
      tipo: m.tipo,
      requiereBanco: m.requiereBanco,
      requiereRed: m.requiereRed,
      requiereReferencia: m.requiereReferencia,
      esCredito: m.esCredito,
      icono: m.icono,
    })),
    bancos: bancos.map((b) => ({ id: b.id, nombre: b.nombre })),
    redesTarjeta: redesTarjeta.map((r) => ({ id: r.id, nombre: r.nombre })),
  }
}