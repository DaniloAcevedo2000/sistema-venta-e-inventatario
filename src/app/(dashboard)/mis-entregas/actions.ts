'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'
import { getCoordsNegocio } from '@/lib/helpers/negocio'

// ============================================
// OBTENER MIS ENTREGAS
// ============================================
export async function getMisEntregas() {
  const user = await requirePermiso('delivery:ver')

  const pedidos = await prisma.pedido.findMany({
    where: {
      repartidorId: user.id,
      estado: { in: ['EN_CAMINO', 'ENTREGADO'] },
    },
    include: {
      zonaEntrega: { select: { nombre: true } },
      sucursal: { select: { nombre: true } },
      _count: { select: { items: true } },
    },
    orderBy: [{ estado: 'asc' }, { enCaminoEn: 'desc' }],
    take: 100,
  })

  const { latitudNegocio, longitudNegocio } = await getCoordsNegocio()

  return pedidos.map((p) => ({
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    clienteNombre: p.clienteNombre,
    clienteTelefono: p.clienteTelefono,
    clienteDireccion: p.clienteDireccion,
    zonaNombre: p.zonaEntrega?.nombre ?? null,
    sucursalNombre: p.sucursal.nombre,
    cantidadItems: p._count.items,
    total: Number(p.total),
    costoEnvio: Number(p.costoEnvio),
    notas: p.notas,
    notasInternas: p.notasInternas,
    latitud: p.latitud,
    longitud: p.longitud,
    latitudNegocio,
    longitudNegocio,
    creadoEn: p.creadoEn.toISOString(),
    enCaminoEn: p.enCaminoEn?.toISOString() ?? null,
    entregadoEn: p.entregadoEn?.toISOString() ?? null,
  }))
}

// ============================================
// OBTENER DETALLE DE UNA ENTREGA
// ============================================
export async function getEntregaDetalle(pedidoId: string) {
  const user = await requirePermiso('delivery:ver')

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      zonaEntrega: { select: { nombre: true } },
      sucursal: { select: { nombre: true } },
      items: true,
    },
  })

  if (!pedido) throw new Error('Pedido no encontrado')

  if (pedido.repartidorId !== user.id) {
    throw new Error('No tienes acceso a este pedido')
  }

  const { latitudNegocio, longitudNegocio } = await getCoordsNegocio()

  return {
    id: pedido.id,
    numero: pedido.numero,
    estado: pedido.estado,
    tipo: pedido.tipo,
    clienteNombre: pedido.clienteNombre,
    clienteTelefono: pedido.clienteTelefono,
    clienteDireccion: pedido.clienteDireccion,
    zonaNombre: pedido.zonaEntrega?.nombre ?? null,
    sucursalNombre: pedido.sucursal.nombre,
    subtotal: Number(pedido.subtotal),
    descuento: Number(pedido.descuento),
    impuesto: Number(pedido.impuesto),
    costoEnvio: Number(pedido.costoEnvio),
    total: Number(pedido.total),
    estadoPago: pedido.estadoPago,
    notas: pedido.notas,
    notasInternas: pedido.notasInternas,
    latitud: pedido.latitud,
    longitud: pedido.longitud,
    latitudNegocio,
    longitudNegocio,
    creadoEn: pedido.creadoEn.toISOString(),
    enCaminoEn: pedido.enCaminoEn?.toISOString() ?? null,
    entregadoEn: pedido.entregadoEn?.toISOString() ?? null,
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

// ============================================
// MARCAR COMO ENTREGADO
// ============================================
export async function marcarEntregadoAction(pedidoId: string) {
  try {
    const user = await requirePermiso('delivery:actualizar')

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
    })

    if (!pedido) return { error: 'Pedido no encontrado' }
    if (pedido.repartidorId !== user.id) {
      return { error: 'No tienes acceso a este pedido' }
    }
    if (pedido.estado !== 'EN_CAMINO') {
      return { error: 'El pedido no está en camino' }
    }

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          estado: 'ENTREGADO',
          entregadoEn: new Date(),
        },
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'pedido.entregado_repartidor',
          entidadTipo: 'Pedido',
          entidadId: pedidoId,
          datosDespues: { estado: 'ENTREGADO' } as any,
        },
      }),
    ])

    revalidatePath('/mis-entregas')
    revalidatePath('/pedidos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Error al marcar como entregado',
    }
  }
}