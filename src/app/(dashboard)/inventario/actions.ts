'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { crearNotificacion } from '@/lib/notificaciones'

type ActionState = {
  success?: boolean
  error?: string
}

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) throw new Error('Sin permisos')
  return session.user
}

// ============================================
// AJUSTAR STOCK DE INSUMO
// ============================================
export async function ajustarStockInsumoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('inventario:ajustar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const { insumoId, sucursalId, tipoAjuste, cantidad, motivo } = payload

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'El motivo es requerido' }
    }

    const cantidadNum = parseFloat(cantidad)
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      return { error: 'La cantidad debe ser mayor o igual a 0' }
    }

    // Buscar o crear stock
    let stock = await prisma.stock.findFirst({
      where: { insumoId, sucursalId },
    })

    const cantidadAnterior = stock ? Number(stock.cantidad) : 0

    if (!stock) {
      stock = await prisma.stock.create({
        data: { insumoId, sucursalId, cantidad: 0 },
      })
    }

    // Calcular nueva cantidad según el tipo de ajuste
    let cantidadNueva = cantidadAnterior
    let cantidadMovimiento = 0

    switch (tipoAjuste) {
      case 'establecer':
        cantidadNueva = cantidadNum
        cantidadMovimiento = cantidadNueva - cantidadAnterior
        break
      case 'sumar':
        cantidadNueva = cantidadAnterior + cantidadNum
        cantidadMovimiento = cantidadNum
        break
      case 'restar':
        cantidadNueva = Math.max(0, cantidadAnterior - cantidadNum)
        cantidadMovimiento = -(cantidadAnterior - cantidadNueva)
        break
    }

    await prisma.$transaction([
      // Actualizar stock
      prisma.stock.update({
        where: { id: stock.id },
        data: { cantidad: cantidadNueva },
      }),
      // Registrar movimiento
      prisma.movimientoInventario.create({
        data: {
          insumoId,
          sucursalId,
          tipo: 'AJUSTE_MANUAL',
          cantidad: cantidadMovimiento,
          cantidadAnterior,
          cantidadNueva,
          motivo,
          usuarioId: user.id,
        },
      }),
      // Auditoría
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'inventario.ajuste_insumo',
          entidadTipo: 'Stock',
          entidadId: stock.id,
          datosDespues: {
            insumoId,
            sucursalId,
            cantidadAnterior,
            cantidadNueva,
            motivo,
          },
        },
      }),
    ])

    await crearNotificacion({
      titulo: 'Ajuste de inventario',
      descripcion: `Se ajustó stock de insumo (${tipoAjuste === 'sumar' ? '+' : tipoAjuste === 'restar' ? '-' : '='} ${cantidadNum}). Motivo: ${motivo}`,
      tipo: 'warning',
      href: '/inventario',
      modulo: 'inventario',
      sucursalId,
      permisoRequerido: 'inventario:leer',
    })

    revalidatePath('/inventario')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al ajustar el stock' }
  }
}

// ============================================
// AJUSTAR STOCK DE PRODUCTO
// ============================================
export async function ajustarStockProductoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('inventario:ajustar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const { productoId, sucursalId, tipoAjuste, cantidad, motivo } = payload

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'El motivo es requerido' }
    }

    const cantidadNum = parseFloat(cantidad)
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      return { error: 'La cantidad debe ser mayor o igual a 0' }
    }

    let stock = await prisma.stock.findFirst({
      where: { productoId, sucursalId },
    })

    const cantidadAnterior = stock ? Number(stock.cantidad) : 0

    if (!stock) {
      stock = await prisma.stock.create({
        data: { productoId, sucursalId, cantidad: 0 },
      })
    }

    let cantidadNueva = cantidadAnterior
    let cantidadMovimiento = 0

    switch (tipoAjuste) {
      case 'establecer':
        cantidadNueva = cantidadNum
        cantidadMovimiento = cantidadNueva - cantidadAnterior
        break
      case 'sumar':
        cantidadNueva = cantidadAnterior + cantidadNum
        cantidadMovimiento = cantidadNum
        break
      case 'restar':
        cantidadNueva = Math.max(0, cantidadAnterior - cantidadNum)
        cantidadMovimiento = -(cantidadAnterior - cantidadNueva)
        break
    }

    await prisma.$transaction([
      prisma.stock.update({
        where: { id: stock.id },
        data: { cantidad: cantidadNueva },
      }),
      prisma.movimientoInventario.create({
        data: {
          productoId,
          sucursalId,
          tipo: 'AJUSTE_MANUAL',
          cantidad: cantidadMovimiento,
          cantidadAnterior,
          cantidadNueva,
          motivo,
          usuarioId: user.id,
        },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'inventario.ajuste_producto',
          entidadTipo: 'Stock',
          entidadId: stock.id,
          datosDespues: {
            productoId,
            sucursalId,
            cantidadAnterior,
            cantidadNueva,
            motivo,
          },
        },
      }),
    ])

    revalidatePath('/inventario')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al ajustar el stock' }
  }
}