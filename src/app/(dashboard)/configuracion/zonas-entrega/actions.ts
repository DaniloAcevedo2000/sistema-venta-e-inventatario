'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export async function crearZonaAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('zonas_entrega:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const descripcion = (formData.get('descripcion') as string) || null
    const tarifa = parseFloat(formData.get('tarifa') as string) || 0
    const tiempoEstimadoMin = formData.get('tiempoEstimadoMin')
      ? parseInt(formData.get('tiempoEstimadoMin') as string)
      : null
    const color = (formData.get('color') as string) || null
    const orden = parseInt(formData.get('orden') as string) || 0

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }
    if (tarifa < 0) return { fieldErrors: { tarifa: ['Debe ser mayor o igual a 0'] } }

    const existente = await prisma.zonaEntrega.findUnique({ where: { codigo } })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    const zona = await prisma.zonaEntrega.create({
      data: {
        codigo,
        nombre,
        descripcion,
        tarifa,
        tiempoEstimadoMin,
        color,
        orden,
        activa: true,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'zona_entrega.crear',
        entidadTipo: 'ZonaEntrega',
        entidadId: zona.id,
        datosDespues: { codigo, nombre, tarifa } as any,
      },
    })

    revalidatePath('/configuracion/zonas-entrega')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear zona' }
  }
}

export async function actualizarZonaAction(
  zonaId: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await verificarPermiso('zonas_entrega:gestionar')

    const codigo = (formData.get('codigo') as string)?.toUpperCase().trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const descripcion = (formData.get('descripcion') as string) || null
    const tarifa = parseFloat(formData.get('tarifa') as string) || 0
    const tiempoEstimadoMin = formData.get('tiempoEstimadoMin')
      ? parseInt(formData.get('tiempoEstimadoMin') as string)
      : null
    const color = (formData.get('color') as string) || null
    const orden = parseInt(formData.get('orden') as string) || 0
    const activa = formData.get('activa') !== 'off'

    if (!codigo) return { fieldErrors: { codigo: ['Requerido'] } }
    if (!nombre) return { fieldErrors: { nombre: ['Requerido'] } }

    const existente = await prisma.zonaEntrega.findFirst({
      where: { codigo, NOT: { id: zonaId } },
    })
    if (existente) {
      return { fieldErrors: { codigo: ['Este código ya existe'] } }
    }

    await prisma.zonaEntrega.update({
      where: { id: zonaId },
      data: {
        codigo,
        nombre,
        descripcion,
        tarifa,
        tiempoEstimadoMin,
        color,
        orden,
        activa,
      },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'zona_entrega.actualizar',
        entidadTipo: 'ZonaEntrega',
        entidadId: zonaId,
        datosDespues: { codigo, nombre, tarifa, activa } as any,
      },
    })

    revalidatePath('/configuracion/zonas-entrega')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al actualizar zona' }
  }
}

export async function toggleZonaAction(zonaId: string) {
  try {
    const user = await verificarPermiso('zonas_entrega:gestionar')
    const zona = await prisma.zonaEntrega.findUnique({ where: { id: zonaId } })
    if (!zona) return { error: 'Zona no encontrada' }

    await prisma.zonaEntrega.update({
      where: { id: zonaId },
      data: { activa: !zona.activa },
    })

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: zona.activa ? 'zona_entrega.desactivar' : 'zona_entrega.activar',
        entidadTipo: 'ZonaEntrega',
        entidadId: zonaId,
      },
    })

    revalidatePath('/configuracion/zonas-entrega')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Error al cambiar estado' }
  }
}