'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'
import bcrypt from 'bcryptjs'

// ============================================
// CREAR USUARIO
// ============================================
export async function crearUsuarioAction(formData: FormData) {
  try {
    await requirePermiso('usuarios:crear')

    const nombre = formData.get('nombre') as string
    const correo = formData.get('correo') as string
    const telefono = formData.get('telefono') as string
    const contrasena = formData.get('contrasena') as string
    const sucursalId = formData.get('sucursalId') as string || null
    const rolId = formData.get('rolId') as string
    const activo = formData.get('activo') === 'on'

    if (!nombre || !correo || !contrasena || !rolId) {
      throw new Error('Todos los campos obligatorios deben estar llenos')
    }

    const existe = await prisma.usuario.findUnique({ where: { correo: correo.toLowerCase() } })
    if (existe) throw new Error('El correo ya está registrado')

    const contrasenaHash = await bcrypt.hash(contrasena, 10)

    await prisma.$transaction(async (tx) => {
      // 1. Crear usuario
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          correo: correo.toLowerCase(),
          telefono: telefono || null,
          contrasenaHash,
          sucursalId,
          activo,
        },
      })

      // 2. Asignar rol
      await tx.usuarioRol.create({
        data: {
          usuarioId: usuario.id,
          rolId,
        },
      })

      // 3. Auditoría
      await tx.auditoria.create({
        data: {
          accion: 'usuario.crear',
          entidadTipo: 'Usuario',
          entidadId: usuario.id,
          datosDespues: { nombre, correo, sucursalId, rolId } as any,
        },
      })
    })

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Error al crear usuario' }
  }
}

// ============================================
// ACTUALIZAR USUARIO
// ============================================
export async function actualizarUsuarioAction(id: string, formData: FormData) {
  try {
    await requirePermiso('usuarios:editar')

    const nombre = formData.get('nombre') as string
    const correo = formData.get('correo') as string
    const telefono = formData.get('telefono') as string
    const contrasena = formData.get('contrasena') as string
    const sucursalId = formData.get('sucursalId') as string || null
    const rolId = formData.get('rolId') as string
    const activo = formData.get('activo') === 'on'

    if (!nombre || !correo || !rolId) {
      throw new Error('Nombre, correo y rol son obligatorios')
    }

    const existe = await prisma.usuario.findFirst({
      where: { correo: correo.toLowerCase(), NOT: { id } },
    })
    if (existe) throw new Error('El correo ya está registrado por otro usuario')

    const updateData: any = {
      nombre,
      correo: correo.toLowerCase(),
      telefono: telefono || null,
      sucursalId,
      activo,
    }

    // Solo actualizamos la contraseña si el campo no está vacío
    if (contrasena && contrasena.trim().length > 0) {
      updateData.contrasenaHash = await bcrypt.hash(contrasena, 10)
    }

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar usuario
      const usuario = await tx.usuario.update({
        where: { id },
        data: updateData,
      })

      // 2. Actualizar rol (eliminar actual y asignar nuevo)
      await tx.usuarioRol.deleteMany({ where: { usuarioId: id } })
      await tx.usuarioRol.create({
        data: {
          usuarioId: usuario.id,
          rolId,
        },
      })

      // 3. Auditoría
      await tx.auditoria.create({
        data: {
          accion: 'usuario.actualizar',
          entidadTipo: 'Usuario',
          entidadId: usuario.id,
          datosDespues: { nombre, correo, sucursalId, rolId, activo } as any,
        },
      })
    })

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Error al actualizar usuario' }
  }
}