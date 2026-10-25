'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { perfilSchema, passwordSchema } from './schema'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// 1. Actualizar Información Básica
export async function actualizarPerfilAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    const raw = {
      nombre: formData.get('nombre') as string,
      telefono: formData.get('telefono') as string,
      biografia: formData.get('biografia') as string,
    }

    const parsed = perfilSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        nombre: parsed.data.nombre,
        telefono: parsed.data.telefono,
        biografia: parsed.data.biografia,
      },
    })

    revalidatePath('/perfil')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar perfil' }
  }
}

// 2. Cambiar Contraseña
export async function cambiarContrasenaAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    const raw = {
      actual: formData.get('actual') as string,
      nueva: formData.get('nueva') as string,
      confirmar: formData.get('confirmar') as string,
    }

    const parsed = passwordSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
    })

    if (!usuario) return { error: 'Usuario no encontrado' }

    const passwordValida = await bcrypt.compare(parsed.data.actual, usuario.contrasenaHash)
    if (!passwordValida) {
      return { fieldErrors: { actual: ['La contraseña actual es incorrecta'] } }
    }

    const nuevoHash = await bcrypt.hash(parsed.data.nueva, 10)

    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { contrasenaHash: nuevoHash },
    })

    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Error al cambiar contraseña' }
  }
}