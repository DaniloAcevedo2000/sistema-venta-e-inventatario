'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'

export async function cambiarSucursalAction(sucursalId: string) {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    // 1. Verificar que el usuario tenga acceso a esta sucursal (opcional si es SUPER_ADMIN)
    const roles = session.user.roles || []
    const esSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')

    if (!esSuperAdmin && session.user.sucursalId !== sucursalId) {
      throw new Error('No tienes acceso a esta sucursal')
    }

    // 2. Verificar que la sucursal esté activa
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalId, activa: true }
    })

    if (!sucursal) {
      throw new Error('La sucursal no existe o está inactiva')
    }

    // Retornamos el ID para que el cliente lo guarde en la sesión (JWT)
    return { success: true, sucursalId }
  } catch (error: any) {
    return { error: error.message || 'Error al cambiar de sucursal' }
  }
}


export async function crearSucursalAction(formData: FormData) {
  try {
    await requirePermiso('sucursales:gestionar')

    const nombre = formData.get('nombre') as string
    const direccion = formData.get('direccion') as string
    const telefono = formData.get('telefono') as string
    const correo = formData.get('correo') as string

    if (!nombre) throw new Error('El nombre es obligatorio')

    // Generar código (SUC-001)
    const count = await prisma.sucursal.count()
    const codigo = `SUC-${String(count + 1).padStart(3, '0')}`

    await prisma.sucursal.create({
      data: {
        codigo,
        nombre,
        direccion,
        telefono,
        correo,
        activa: true,
      }
    })

    revalidatePath('/sucursales')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function actualizarSucursalAction(id: string, formData: FormData) {
  try {
    await requirePermiso('sucursales:gestionar')

    const nombre = formData.get('nombre') as string
    const direccion = formData.get('direccion') as string
    const telefono = formData.get('telefono') as string
    const correo = formData.get('correo') as string
    const activa = formData.get('activa') === 'on'

    if (!nombre) throw new Error('El nombre es obligatorio')

    await prisma.sucursal.update({
      where: { id },
      data: { nombre, direccion, telefono, correo, activa }
    })

    revalidatePath('/sucursales')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function toggleActivoSucursalAction(id: string) {
  try {
    await requirePermiso('sucursales:gestionar')

    const sucursal = await prisma.sucursal.findUnique({ where: { id } })
    if (!sucursal) throw new Error('Sucursal no encontrada')

    // Si vamos a desactivar, verificamos que no haya operaciones pendientes
    if (sucursal.activa) {
      const cajasAbiertas = await prisma.sesionCaja.count({
        where: { sucursalId: id, estado: 'ABIERTA' }
      })
      if (cajasAbiertas > 0) throw new Error('No se puede desactivar: hay cajas abiertas.')
    }

    await prisma.sucursal.update({
      where: { id },
      data: { activa: !sucursal.activa }
    })

    revalidatePath('/sucursales')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}