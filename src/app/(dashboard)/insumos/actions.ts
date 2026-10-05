'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { insumoSchema, actualizacionMasivaSchema } from './schema'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) throw new Error('Sin permisos')
  return session.user
}

// ============================================
// CREAR INSUMO
// ============================================
export async function crearInsumoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('inventario:ajustar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = insumoSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    const existente = await prisma.insumo.findUnique({
      where: { codigo: data.codigo },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const insumo = await prisma.insumo.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        unidadMedidaId: data.unidadMedidaId,
        categoriaInsumo: data.categoriaInsumo,
        costoUnitario: data.costoUnitario,
        stockMinimo: data.stockMinimo,
        imagenUrl: data.imagenUrl || null,
        activo: data.activo,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuarioId: user.id,
        accion: 'insumo.crear',
        entidadTipo: 'Insumo',
        entidadId: insumo.id,
        datosDespues: data as any,
      },
    })

    revalidatePath('/insumos')
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al crear el insumo' }
  }

  redirect('/insumos')
}

// ============================================
// ACTUALIZAR INSUMO
// ============================================
export async function actualizarInsumoAction(
  id: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('inventario:ajustar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = insumoSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    const existente = await prisma.insumo.findFirst({
      where: { codigo: data.codigo, NOT: { id } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const anterior = await prisma.insumo.findUnique({ where: { id } })

    await prisma.$transaction([
      prisma.insumo.update({
        where: { id },
        data: {
          codigo: data.codigo.toUpperCase(),
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          unidadMedidaId: data.unidadMedidaId,
          categoriaInsumo: data.categoriaInsumo,
          costoUnitario: data.costoUnitario,
          stockMinimo: data.stockMinimo,
          imagenUrl: data.imagenUrl || null,
          activo: data.activo,
        },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'insumo.actualizar',
          entidadTipo: 'Insumo',
          entidadId: id,
          datosAntes: anterior as any,
          datosDespues: data as any,
        },
      }),
    ])

    revalidatePath('/insumos')
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al actualizar el insumo' }
  }

  redirect('/insumos')
}

// ============================================
// TOGGLE ACTIVO
// ============================================
export async function toggleActivoInsumoAction(id: string, motivo: string) {
  try {
    const user = await verificarPermiso('inventario:ajustar')
    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo' }
    }

    const insumo = await prisma.insumo.findUnique({ where: { id } })
    if (!insumo) return { error: 'Insumo no encontrado' }

    const nuevoEstado = !insumo.activo

    await prisma.$transaction([
      prisma.insumo.update({
        where: { id },
        data: { activo: nuevoEstado },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: nuevoEstado ? 'insumo.activar' : 'insumo.desactivar',
          entidadTipo: 'Insumo',
          entidadId: id,
          datosDespues: { motivo },
        },
      }),
    ])

    revalidatePath('/insumos')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al cambiar estado' }
  }
}

// ============================================
// ELIMINAR
// ============================================
export async function eliminarInsumoAction(id: string, motivo: string) {
  try {
    const user = await verificarPermiso('inventario:ajustar')
    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo' }
    }

    // Verificar uso en recetas
    const recetas = await prisma.recetaItem.count({ where: { insumoId: id } })
    if (recetas > 0) {
      return {
        error: `No se puede eliminar: se usa en ${recetas} receta(s). Desactívalo en su lugar.`,
      }
    }

    // Verificar movimientos
    const movimientos = await prisma.movimientoInventario.count({
      where: { insumoId: id },
    })
    if (movimientos > 0) {
      return {
        error: `No se puede eliminar: tiene ${movimientos} movimiento(s) de inventario. Desactívalo en su lugar.`,
      }
    }

    await prisma.$transaction([
      prisma.insumo.delete({ where: { id } }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'insumo.eliminar',
          entidadTipo: 'Insumo',
          entidadId: id,
          datosDespues: { motivo },
        },
      }),
    ])

    revalidatePath('/insumos')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al eliminar el insumo' }
  }
}

// ============================================
// ACTUALIZACIÓN MASIVA DE PRECIOS
// ============================================
export async function actualizarPreciosMasivoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('inventario:ajustar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = actualizacionMasivaSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const { insumoIds, tipo, valor, operacion } = parsed.data

    // Obtener insumos actuales
    const insumos = await prisma.insumo.findMany({
      where: { id: { in: insumoIds } },
    })

    // Calcular nuevos precios
    const actualizaciones = insumos.map((insumo) => {
      const costoActual = Number(insumo.costoUnitario)
      let nuevoCosto = costoActual

      if (operacion === 'establecer') {
        nuevoCosto = valor
      } else if (tipo === 'porcentaje') {
        const delta = (costoActual * valor) / 100
        nuevoCosto = operacion === 'aumentar' ? costoActual + delta : costoActual - delta
      } else {
        nuevoCosto = operacion === 'aumentar' ? costoActual + valor : costoActual - valor
      }

      return {
        id: insumo.id,
        codigo: insumo.codigo,
        nombre: insumo.nombre,
        anterior: costoActual,
        nuevo: Math.max(0, nuevoCosto),
      }
    })

    // Aplicar cambios en transacción
    await prisma.$transaction([
      ...actualizaciones.map((u) =>
        prisma.insumo.update({
          where: { id: u.id },
          data: { costoUnitario: u.nuevo },
        })
      ),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'insumo.precios_masivos',
          entidadTipo: 'Insumo',
          datosDespues: {
            insumoIds,
            tipo,
            valor,
            operacion,
            actualizaciones,
          } as any,
        },
      }),
    ])

    revalidatePath('/insumos')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al actualizar precios' }
  }
}