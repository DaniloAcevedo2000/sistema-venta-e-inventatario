'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      items: true,
    },
  })

  if (!pedido) throw new Error('Pedido no encontrado')

  // ============================================
  // COORDENADAS DEL NEGOCIO
  // ============================================
  const configNegocio = await prisma.configuracion.findMany({
    where: {
      clave: {
        in: ['negocio.latitud', 'negocio.longitud'],
      },
    },
  })

  const latitudNegocio = parseFloat(
    configNegocio.find((c) => c.clave === 'negocio.latitud')?.valor ?? '0'
  )
  const longitudNegocio = parseFloat(
    configNegocio.find((c) => c.clave === 'negocio.longitud')?.valor ?? '0'
  )

  return {
    id: pedido.id,
    numero: pedido.numero,
    tipo: pedido.tipo,
    estado: pedido.estado,
    estadoPago: pedido.estadoPago,
    clienteNombre: pedido.clienteNombre,
    clienteTelefono: pedido.clienteTelefono,
    clienteDireccion: pedido.clienteDireccion,
    zonaNombre: pedido.zonaEntrega?.nombre ?? null,
    sucursalNombre: pedido.sucursal.nombre,
    repartidorNombre: pedido.repartidor?.nombre ?? null,
    repartidorId: pedido.repartidorId,
    creadoPor: pedido.usuarioCreacion.nombre,
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

    // Coordenadas de entrega y del negocio
    latitud: pedido.latitud ?? null,
    longitud: pedido.longitud ?? null,
    latitudNegocio: latitudNegocio || null,
    longitudNegocio: longitudNegocio || null,

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

  const repartidores = await prisma.usuario.findMany({
    where: {
      activo: true,
      roles: {
        some: { rol: { codigo: 'REPARTIDOR' } },
      },
    },
    select: {
      id: true,
      nombre: true,
    },
    orderBy: { nombre: 'asc' },
  })

  return repartidores
}