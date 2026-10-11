'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pedidoSchema } from './schema'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  pedidoId?: string
}

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) throw new Error('Sin permisos')
  return session.user
}

// ============================================
// CREAR PEDIDO
// ============================================
export async function crearPedidoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  let pedidoId: string | null = null

  try {
    const user = await verificarPermiso('pedidos:crear')

    if (!user.sucursalId) {
      return { error: 'Usuario sin sucursal asignada' }
    }

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = pedidoSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    // Validaciones específicas
    if (data.tipo === 'DELIVERY') {
      if (!data.clienteDireccion?.trim()) {
        return { fieldErrors: { clienteDireccion: ['Requerido para delivery'] } }
      }
      if (!data.zonaEntregaId) {
        return { fieldErrors: { zonaEntregaId: ['Selecciona una zona'] } }
      }
    }

    // Cargar zona de entrega si aplica
    let costoEnvio = 0
    if (data.tipo === 'DELIVERY' && data.zonaEntregaId) {
      const zona = await prisma.zonaEntrega.findUnique({
        where: { id: data.zonaEntregaId },
      })
      if (!zona || !zona.activa) {
        return { error: 'Zona de entrega no válida' }
      }
      costoEnvio = Number(zona.tarifa)
    }

    // Calcular totales
    let subtotal = 0
    let descuentoTotal = 0
    let ivaTotal = 0

    const itemsCalculados = data.items.map((item) => {
      const bruto = item.precioUnitario * item.cantidad
      const descuento = (bruto * item.descuento) / 100
      const neto = bruto - descuento

      let iva = 0
      if (item.tipoImpuesto === 'GRAVADO_15') {
        iva = neto - neto / 1.15
      }

      subtotal += bruto
      descuentoTotal += descuento
      ivaTotal += iva

      return {
        ...item,
        subtotal: bruto,
        descuentoMonto: descuento,
        impuesto: iva,
        total: neto,
      }
    })

    const total = subtotal - descuentoTotal + costoEnvio

    // Generar número correlativo por sucursal
    const año = new Date().getFullYear()
    const ultimoPedido = await prisma.pedido.findFirst({
      where: { sucursalId: user.sucursalId },
      orderBy: { numeroSucursal: 'desc' },
      select: { numeroSucursal: true },
    })
    const numeroPedidoSucursal = (ultimoPedido?.numeroSucursal ?? 0) + 1
    const numeroPedidoCompleto = `P-${año}-${String(numeroPedidoSucursal).padStart(6, '0')}`

    // Crear pedido
    const pedido = await prisma.pedido.create({
      data: {
        numero: numeroPedidoCompleto,
        numeroSucursal: numeroPedidoSucursal,
        tipo: data.tipo,
        estado: 'PENDIENTE',
        sucursal: { connect: { id: user.sucursalId } },
        cliente: data.clienteId
          ? { connect: { id: data.clienteId } }
          : undefined,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        clienteDireccion: data.clienteDireccion || null,
        zonaEntrega: data.zonaEntregaId
          ? { connect: { id: data.zonaEntregaId } }
          : undefined,
        usuarioCreacion: { connect: { id: user.id } },
        fechaProgramada: data.fechaProgramada
          ? new Date(data.fechaProgramada)
          : null,
        subtotal,
        descuento: descuentoTotal,
        impuesto: ivaTotal,
        costoEnvio,
        total,
        estadoPago: 'PENDIENTE',
        notas: data.notas || null,
        notasInternas: data.notasInternas || null,

        // Coordenadas (opcionales)
        latitud: data.latitud ?? null,
        longitud: data.longitud ?? null,

        items: {
          create: itemsCalculados.map((item) => ({
            producto: { connect: { id: item.productoId } },
            variante: item.varianteId
              ? { connect: { id: item.varianteId } }
              : undefined,
            nombreProducto: item.nombreProducto,
            nombreVariante: item.nombreVariante || null,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuentoMonto,
            subtotal: item.subtotal,
            impuesto: item.impuesto,
            total: item.total,
            tipoImpuesto: item.tipoImpuesto,
            notas: item.notas || null,
          })),
        },
      },
    })

    pedidoId = pedido.id

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'pedido.crear',
        entidadTipo: 'Pedido',
        entidadId: pedido.id,
        datosDespues: {
          numero: numeroPedidoCompleto,
          tipo: data.tipo,
          total,
        } as any,
      },
    })

    revalidatePath('/pedidos')
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear pedido' }
  }

  // ⚠️ Redirigir FUERA del try/catch al detalle del pedido
  // Pasamos el ID como query param para que el listado abra el dialog automáticamente
  redirect(`/pedidos?pedidoId=${pedidoId}`)
}

// ============================================
// CAMBIAR ESTADO DEL PEDIDO
// ============================================
export async function cambiarEstadoPedidoAction(
  pedidoId: string,
  nuevoEstado: string,
  motivo?: string
) {
  try {
    const user = await verificarPermiso('pedidos:editar')

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
    })
    if (!pedido) return { error: 'Pedido no encontrado' }

    // Validar transición
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
      CONFIRMADO: ['EN_PREPARACION', 'CANCELADO'],
      EN_PREPARACION: ['LISTO', 'CANCELADO'],
      LISTO: ['EN_CAMINO', 'ENTREGADO', 'CANCELADO'],
      EN_CAMINO: ['ENTREGADO'],
      ENTREGADO: [],
      CANCELADO: [],
    }

    const estadosPermitidos = transicionesValidas[pedido.estado] ?? []
    if (!estadosPermitidos.includes(nuevoEstado)) {
      return {
        error: `No se puede pasar de ${pedido.estado} a ${nuevoEstado}`,
      }
    }

    // Datos según el nuevo estado
    const updateData: any = { estado: nuevoEstado }
    const now = new Date()

    switch (nuevoEstado) {
      case 'CONFIRMADO':
        updateData.confirmadoEn = now
        break
      case 'EN_PREPARACION':
        updateData.preparacionEn = now
        break
      case 'LISTO':
        updateData.listoEn = now
        break
      case 'EN_CAMINO':
        updateData.enCaminoEn = now
        break
      case 'ENTREGADO':
        updateData.entregadoEn = now
        break
      case 'CANCELADO':
        if (!motivo || motivo.trim().length < 3) {
          return { error: 'El motivo de cancelación es requerido' }
        }
        updateData.canceladoEn = now
        updateData.motivoCancelacion = motivo
        break
    }

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedidoId },
        data: updateData,
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: `pedido.${nuevoEstado.toLowerCase()}`,
          entidadTipo: 'Pedido',
          entidadId: pedidoId,
          datosAntes: { estado: pedido.estado } as any,
          datosDespues: { estado: nuevoEstado, motivo } as any,
        },
      }),
    ])

    revalidatePath('/pedidos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al cambiar estado' }
  }
}

// ============================================
// ASIGNAR REPARTIDOR
// ============================================
export async function asignarRepartidorAction(
  pedidoId: string,
  repartidorId: string
) {
  try {
    const user = await verificarPermiso('pedidos:asignar_repartidor')

    const repartidor = await prisma.usuario.findUnique({
      where: { id: repartidorId },
      include: { roles: { include: { rol: true } } },
    })

    if (!repartidor) return { error: 'Repartidor no encontrado' }

    const tieneRol = repartidor.roles.some(
      (r) => r.rol.codigo === 'REPARTIDOR'
    )
    if (!tieneRol) return { error: 'El usuario no es repartidor' }

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          repartidorId,
          estado: 'EN_CAMINO',
          enCaminoEn: new Date(),
        },
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'pedido.asignar_repartidor',
          entidadTipo: 'Pedido',
          entidadId: pedidoId,
          datosDespues: { repartidorId } as any,
        },
      }),
    ])

    revalidatePath('/pedidos')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al asignar repartidor' }
  }
}