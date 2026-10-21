'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'

export async function crearRolAction(formData: FormData) {
  try {
    const session = await requirePermiso('roles:gestionar')

    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const permisosIds = formData.getAll('permisos') as string[]
    const activo = formData.get('activo') === 'on'

    if (!nombre) throw new Error('El nombre es obligatorio')

    // Generar código (ej: ROL-001)
    const count = await prisma.rol.count()
    const codigo = `ROL-${String(count + 1).padStart(3, '0')}`

    await prisma.$transaction(async (tx) => {
      // 1. Crear el rol
      const rol = await tx.rol.create({
        data: {
          codigo,
          nombre,
          descripcion,
          esSistema: false,
          activo,
        },
      })

      // 2. Asignar permisos si hay
      if (permisosIds.length > 0) {
        await tx.rolPermiso.createMany({
          data: permisosIds.map((permisoId) => ({
            rolId: rol.id,
            permisoId,
          })),
        })
      }

      // 3. Auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: session.id,
          accion: 'rol.crear',
          entidadTipo: 'Rol',
          entidadId: rol.id,
          datosDespues: { nombre, codigo, permisos: permisosIds.length } as any,
        },
      })
    })

    revalidatePath('/roles')
    return { success: true }
  } catch (error: any) {
    console.error('Error al crear rol:', error)
    return { error: error.message || 'Error al crear rol' }
  }
}

export async function actualizarRolAction(id: string, formData: FormData) {
  try {
    const session = await requirePermiso('roles:gestionar')

    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string
    const permisosIds = formData.getAll('permisos') as string[]
    const activo = formData.get('activo') === 'on'

    if (!nombre) throw new Error('El nombre es obligatorio')

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar el rol
      await tx.rol.update({
        where: { id },
        data: { nombre, descripcion, activo },
      })

      // 2. Eliminar los permisos actuales
      await tx.rolPermiso.deleteMany({ where: { rolId: id } })

      // 3. Asignar los nuevos permisos
      if (permisosIds.length > 0) {
        await tx.rolPermiso.createMany({
          data: permisosIds.map((permisoId) => ({
            rolId: id,
            permisoId,
          })),
        })
      }

      // 4. Auditoría
      await tx.auditoria.create({
        data: {
          usuarioId: session.id,
          accion: 'rol.actualizar',
          entidadTipo: 'Rol',
          entidadId: id,
          datosDespues: { nombre, permisos: permisosIds.length } as any,
        },
      })
    })

    revalidatePath('/roles')
    return { success: true }
  } catch (error: any) {
    console.error('Error al actualizar rol:', error)
    return { error: error.message || 'Error al actualizar rol' }
  }
}