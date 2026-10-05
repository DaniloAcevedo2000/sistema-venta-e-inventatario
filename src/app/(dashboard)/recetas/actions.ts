'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recetaSchema } from './schema'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) {
    throw new Error('Sin permisos')
  }
  return session.user
}

// ============================================
// CREAR RECETA
// ============================================
export async function crearRecetaAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('productos:editar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = recetaSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    // Verificar que el producto exista
    const producto = await prisma.producto.findUnique({
      where: { id: data.productoId },
    })
    if (!producto) {
      return { error: 'Producto no encontrado' }
    }

    // Verificar que no tenga receta ya
    const existente = await prisma.receta.findUnique({
      where: { productoId: data.productoId },
    })
    if (existente) {
      return { error: 'Este producto ya tiene una receta' }
    }

    const receta = await prisma.receta.create({
      data: {
        productoId: data.productoId,
        notas: data.notas || null,
        activa: data.activa,
        items: {
          create: data.items.map((item) => ({
            insumoId: item.insumoId,
            cantidad: item.cantidad,
            unidadMedidaId: item.unidadMedidaId,
            mermaPorcentaje: item.mermaPorcentaje,
          })),
        },
      },
    })

    await prisma.auditoria.create({
      data: {
        usuarioId: user.id,
        accion: 'receta.crear',
        entidadTipo: 'Receta',
        entidadId: receta.id,
        datosDespues: data,
      },
    })

    revalidatePath('/recetas')
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al crear la receta' }
  }

  redirect('/recetas')
}

// ============================================
// ACTUALIZAR RECETA
// ============================================
export async function actualizarRecetaAction(
  recetaId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('productos:editar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = recetaSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    const anterior = await prisma.receta.findUnique({
      where: { id: recetaId },
      include: { items: true },
    })

    await prisma.$transaction(async (tx) => {
      // Borrar items viejos
      await tx.recetaItem.deleteMany({ where: { recetaId } })

      // Actualizar receta + crear items nuevos
      await tx.receta.update({
        where: { id: recetaId },
        data: {
          notas: data.notas || null,
          activa: data.activa,
          items: {
            create: data.items.map((item) => ({
              insumoId: item.insumoId,
              cantidad: item.cantidad,
              unidadMedidaId: item.unidadMedidaId,
              mermaPorcentaje: item.mermaPorcentaje,
            })),
          },
        },
      })

      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'receta.actualizar',
          entidadTipo: 'Receta',
          entidadId: recetaId,
          datosAntes: anterior as any,
          datosDespues: data,
        },
      })
    })

    revalidatePath('/recetas')
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al actualizar la receta' }
  }

  redirect('/recetas')
}

// ============================================
// ELIMINAR RECETA
// ============================================
export async function eliminarRecetaAction(recetaId: string, motivo: string) {
  try {
    const user = await verificarPermiso('productos:editar')

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo' }
    }

    const receta = await prisma.receta.findUnique({
      where: { id: recetaId },
    })
    if (!receta) return { error: 'Receta no encontrada' }

    await prisma.$transaction([
      prisma.receta.delete({ where: { id: recetaId } }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'receta.eliminar',
          entidadTipo: 'Receta',
          entidadId: recetaId,
          datosDespues: { motivo },
        },
      }),
    ])

    revalidatePath('/recetas')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al eliminar la receta' }
  }
}

// ============================================
// TOGGLE ACTIVA
// ============================================
export async function toggleActivaRecetaAction(recetaId: string, motivo: string) {
  try {
    const user = await verificarPermiso('productos:editar')

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo' }
    }

    const receta = await prisma.receta.findUnique({ where: { id: recetaId } })
    if (!receta) return { error: 'Receta no encontrada' }

    const nuevoEstado = !receta.activa

    await prisma.$transaction([
      prisma.receta.update({
        where: { id: recetaId },
        data: { activa: nuevoEstado },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: nuevoEstado ? 'receta.activar' : 'receta.desactivar',
          entidadTipo: 'Receta',
          entidadId: recetaId,
          datosDespues: { motivo },
        },
      }),
    ])

    revalidatePath('/recetas')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al cambiar estado' }
  }
}