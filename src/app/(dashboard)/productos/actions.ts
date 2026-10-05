'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { productoSchema } from './schema'

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
// CREAR PRODUCTO
// ============================================
export async function crearProductoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  console.log('crearProductoAction iniciado')

  try {
    const user = await verificarPermiso('productos:crear')

    // Leer payload JSON
    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) {
      return { error: 'No se recibieron datos' }
    }

    const payload = JSON.parse(payloadRaw)
    console.log('Payload recibido:', payload)

    // Validar manualmente
    const errores: Record<string, string[]> = {}
    if (!payload.codigo?.trim()) errores.codigo = ['El código es requerido']
    if (!payload.nombre?.trim()) errores.nombre = ['El nombre es requerido']
    if (!payload.categoriaId) errores.categoriaId = ['La categoría es requerida']

    if (Object.keys(errores).length > 0) {
      console.error('Errores:', errores)
      return { fieldErrors: errores }
    }

    // Verificar código único
    const existente = await prisma.producto.findUnique({
      where: { codigo: payload.codigo },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const tipo = payload.tipo || 'simple'
    const tipoImpuesto = payload.tipoImpuesto || 'GRAVADO_15'

    console.log('Creando producto...')

    const producto = await prisma.producto.create({
      data: {
        codigo: payload.codigo.toUpperCase(),
        nombre: payload.nombre,
        descripcion: payload.descripcion || null,
        categoriaId: payload.categoriaId,
        tipo,
        precioBase: parseFloat(payload.precioBase) || 0,
        costo: parseFloat(payload.costo) || 0,
        tipoImpuesto,
        imagenUrl: payload.imagenUrl || null,
        color: payload.color || null,
        codigoBarras: payload.codigoBarras || null,
        activo: payload.activo ?? true,
        destacado: payload.destacado ?? false,
        permiteDescuento: payload.permiteDescuento ?? true,
        orden: parseInt(payload.orden) || 0,
        creadoPorId: user.id,
        variantes:
          tipo === 'variantes' && payload.variantes?.length > 0
            ? {
                create: payload.variantes.map((v: any) => ({
                  codigo: v.codigo,
                  nombre: v.nombre,
                  precio: parseFloat(v.precio) || 0,
                  costo: parseFloat(v.costo) || 0,
                  orden: v.orden || 0,
                  activo: true,
                })),
              }
            : undefined,
      },
    })

    console.log('Producto creado:', producto.id)

    await prisma.auditoria.create({
      data: {
        usuarioId: user.id,
        accion: 'producto.crear',
        entidadTipo: 'Producto',
        entidadId: producto.id,
        datosDespues: payload,
      },
    })

    revalidatePath('/productos')
    console.log('Revalidado')
  } catch (error) {
    console.error('Error:', error)
    return {
      error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`,
    }
  }

  console.log('Redirigiendo a /productos')
  redirect('/productos')
}

// ============================================
// ACTUALIZAR PRODUCTO
// ============================================
export async function actualizarProductoAction(
  id: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  console.log('🚀 actualizarProductoAction iniciado, id:', id)

  try {
    const user = await verificarPermiso('productos:editar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) {
      return { error: 'No se recibieron datos' }
    }

    const payload = JSON.parse(payloadRaw)
    console.log('Payload recibido:', payload)

    // Validar manualmente
    const errores: Record<string, string[]> = {}
    if (!payload.codigo?.trim()) errores.codigo = ['El código es requerido']
    if (!payload.nombre?.trim()) errores.nombre = ['El nombre es requerido']
    if (!payload.categoriaId) errores.categoriaId = ['La categoría es requerida']

    if (Object.keys(errores).length > 0) {
      return { fieldErrors: errores }
    }

    // Verificar código duplicado
    const existente = await prisma.producto.findFirst({
      where: { codigo: payload.codigo, NOT: { id } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    // Datos anteriores para auditoría
    const productoAnterior = await prisma.producto.findUnique({
      where: { id },
      include: { variantes: true },
    })

    const tipo = payload.tipo || 'simple'
    const tipoImpuesto = payload.tipoImpuesto || 'GRAVADO_15'

    console.log('Actualizando producto...')

    await prisma.$transaction(async (tx) => {
      // Borrar variantes viejas
      await tx.productoVariante.deleteMany({ where: { productoId: id } })

      // Actualizar producto
      await tx.producto.update({
        where: { id },
        data: {
          codigo: payload.codigo.toUpperCase(),
          nombre: payload.nombre,
          descripcion: payload.descripcion || null,
          categoriaId: payload.categoriaId,
          tipo,
          precioBase: parseFloat(payload.precioBase) || 0,
          costo: parseFloat(payload.costo) || 0,
          tipoImpuesto,
          imagenUrl: payload.imagenUrl || null,
          color: payload.color || null,
          codigoBarras: payload.codigoBarras || null,
          activo: payload.activo ?? true,
          destacado: payload.destacado ?? false,
          permiteDescuento: payload.permiteDescuento ?? true,
          orden: parseInt(payload.orden) || 0,
          motivoCambio: payload.motivoCambio || null,
          variantes:
            tipo === 'variantes' && payload.variantes?.length > 0
              ? {
                  create: payload.variantes.map((v: any) => ({
                    codigo: v.codigo,
                    nombre: v.nombre,
                    precio: parseFloat(v.precio) || 0,
                    costo: parseFloat(v.costo) || 0,
                    orden: v.orden || 0,
                    activo: true,
                  })),
                }
              : undefined,
        },
      })

      await tx.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'producto.actualizar',
          entidadTipo: 'Producto',
          entidadId: id,
          datosAntes: productoAnterior as any,
          datosDespues: payload,
        },
      })
    })

    console.log('Producto actualizado')
    revalidatePath('/productos')
  } catch (error) {
    console.error('Error:', error)
    return {
      error: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`,
    }
  }

  console.log('Redirigiendo')
  redirect('/productos')
}


// ============================================
// TOGGLE ACTIVO (con motivo)
// ============================================
export async function toggleActivoProductoAction(id: string, motivo: string) {
  try {
    const user = await verificarPermiso('productos:editar')

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo (mínimo 3 caracteres)' }
    }

    const producto = await prisma.producto.findUnique({ where: { id } })
    if (!producto) return { error: 'Producto no encontrado' }

    const nuevoEstado = !producto.activo

    await prisma.$transaction([
      prisma.producto.update({
        where: { id },
        data: {
          activo: nuevoEstado,
          motivoCambio: motivo,
          desactivadoEn: nuevoEstado ? null : new Date(),
          desactivadoPorId: nuevoEstado ? null : user.id,
        },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: nuevoEstado ? 'producto.activar' : 'producto.desactivar',
          entidadTipo: 'Producto',
          entidadId: id,
          datosAntes: { activo: producto.activo } as any,
          datosDespues: { activo: nuevoEstado, motivo } as any,
        },
      }),
    ])

    revalidatePath('/productos')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al cambiar estado' }
  }
}

// ============================================
// ELIMINAR (soft delete con motivo)
// ============================================
export async function eliminarProductoAction(id: string, motivo: string) {
  try {
    const user = await verificarPermiso('productos:eliminar')

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo (mínimo 3 caracteres)' }
    }

    const ventasAsociadas = await prisma.itemVenta.count({
      where: { productoId: id },
    })

    if (ventasAsociadas > 0) {
      return {
        error: `No se puede eliminar: tiene ${ventasAsociadas} ventas asociadas. Desactívalo en su lugar.`,
      }
    }

    await prisma.$transaction([
      prisma.producto.update({
        where: { id },
        data: {
          activo: false,
          motivoCambio: `[ELIMINADO] ${motivo}`,
          desactivadoEn: new Date(),
          desactivadoPorId: user.id,
        },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'producto.eliminar',
          entidadTipo: 'Producto',
          entidadId: id,
          datosDespues: { motivo } as any,
        },
      }),
    ])

    revalidatePath('/productos')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al eliminar producto' }
  }
}