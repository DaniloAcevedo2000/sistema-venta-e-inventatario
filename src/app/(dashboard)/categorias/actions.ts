'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { categoriaSchema } from './schema'

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
// CREAR CATEGORÍA
// ============================================
export async function crearCategoriaAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('categorias:gestionar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = categoriaSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    // Código único
    const existente = await prisma.categoria.findUnique({
      where: { codigo: data.codigo },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    // Verificar padre si aplica
    if (data.padreId) {
      const padre = await prisma.categoria.findUnique({
        where: { id: data.padreId },
      })
      if (!padre) {
        return { fieldErrors: { padreId: ['La categoría padre no existe'] } }
      }
    }

    const categoria = await prisma.categoria.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        padreId: data.padreId || null,
        icono: data.icono || null,
        color: data.color || null,
        orden: data.orden,
        activo: data.activo,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuarioId: user.id,
        accion: 'categoria.crear',
        entidadTipo: 'Categoria',
        entidadId: categoria.id,
        datosDespues: data,
      },
    })

    revalidatePath('/categorias')
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al crear la categoría' }
  }

  redirect('/categorias')
}

// ============================================
// ACTUALIZAR CATEGORÍA
// ============================================
export async function actualizarCategoriaAction(
  id: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('categorias:gestionar')

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = categoriaSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    // Código único (excepto la propia)
    const existente = await prisma.categoria.findFirst({
      where: { codigo: data.codigo, NOT: { id } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    // No puede ser su propio padre
    if (data.padreId === id) {
      return { fieldErrors: { padreId: ['Una categoría no puede ser su propio padre'] } }
    }

    // Evitar ciclos: verificar que el padre no sea descendiente
    if (data.padreId) {
      const descendientes = await obtenerDescendientes(id)
      if (descendientes.includes(data.padreId)) {
        return {
          fieldErrors: {
            padreId: ['No se puede asignar como padre a una categoría descendiente'],
          },
        }
      }
    }

    const anterior = await prisma.categoria.findUnique({ where: { id } })

    await prisma.$transaction([
      prisma.categoria.update({
        where: { id },
        data: {
          codigo: data.codigo.toUpperCase(),
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          padreId: data.padreId || null,
          icono: data.icono || null,
          color: data.color || null,
          orden: data.orden,
          activo: data.activo,
        },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'categoria.actualizar',
          entidadTipo: 'Categoria',
          entidadId: id,
          datosAntes: anterior as any,
          datosDespues: data,
        },
      }),
    ])

    revalidatePath('/categorias')
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al actualizar la categoría' }
  }

  redirect('/categorias')
}

// ============================================
// TOGGLE ACTIVO
// ============================================
export async function toggleActivoCategoriaAction(id: string, motivo: string) {
  try {
    const user = await verificarPermiso('categorias:gestionar')

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo' }
    }

    const categoria = await prisma.categoria.findUnique({ where: { id } })
    if (!categoria) return { error: 'Categoría no encontrada' }

    const nuevoEstado = !categoria.activo

    await prisma.$transaction([
      prisma.categoria.update({
        where: { id },
        data: { activo: nuevoEstado },
      }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: nuevoEstado ? 'categoria.activar' : 'categoria.desactivar',
          entidadTipo: 'Categoria',
          entidadId: id,
          datosDespues: { motivo },
        },
      }),
    ])

    revalidatePath('/categorias')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al cambiar estado' }
  }
}

// ============================================
// ELIMINAR
// ============================================
export async function eliminarCategoriaAction(id: string, motivo: string) {
  try {
    const user = await verificarPermiso('categorias:gestionar')

    if (!motivo || motivo.trim().length < 3) {
      return { error: 'Debes indicar un motivo' }
    }

    // Verificar si tiene productos
    const productos = await prisma.producto.count({ where: { categoriaId: id } })
    if (productos > 0) {
      return {
        error: `No se puede eliminar: tiene ${productos} producto(s) asociado(s). Desactívala o mueve los productos.`,
      }
    }

    // Verificar si tiene subcategorías
    const subcategorias = await prisma.categoria.count({ where: { padreId: id } })
    if (subcategorias > 0) {
      return {
        error: `No se puede eliminar: tiene ${subcategorias} subcategoría(s). Elimínalas primero.`,
      }
    }

    await prisma.$transaction([
      prisma.categoria.delete({ where: { id } }),
      prisma.auditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'categoria.eliminar',
          entidadTipo: 'Categoria',
          entidadId: id,
          datosDespues: { motivo },
        },
      }),
    ])

    revalidatePath('/categorias')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error al eliminar la categoría' }
  }
}

// ============================================
// HELPER: obtener descendientes (para evitar ciclos)
// ============================================
async function obtenerDescendientes(categoriaId: string): Promise<string[]> {
  const descendientes: string[] = []
  const cola = [categoriaId]

  while (cola.length > 0) {
    const actualId = cola.shift()!
    const hijas = await prisma.categoria.findMany({
      where: { padreId: actualId },
      select: { id: true },
    })
    for (const hija of hijas) {
      descendientes.push(hija.id)
      cola.push(hija.id)
    }
  }

  return descendientes
}