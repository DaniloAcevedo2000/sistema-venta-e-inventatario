'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const cajaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  codigo: z.string().min(1, 'El código es requerido').max(20),
  sucursalId: z.string().min(1, 'La sucursal es requerida'),
  orden: z.coerce.number().default(0),
})

async function verificarPermiso() {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes('configuracion:gestionar') && !session.user.permisos.includes('sucursales:gestionar')) {
    throw new Error('Sin permisos para gestionar cajas')
  }
  return session.user
}

export async function guardarCajaAction(
  id: string | null,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    await verificarPermiso()

    const raw = {
      nombre: formData.get('nombre') as string,
      codigo: formData.get('codigo') as string,
      sucursalId: formData.get('sucursalId') as string,
      orden: formData.get('orden') as string,
    }

    const parsed = cajaSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    if (id) {
      await prisma.caja.update({
        where: { id },
        data,
      })
    } else {
      await prisma.caja.create({
        data,
      })
    }

    revalidatePath('/configuracion/cajas')
    return { success: true }
  } catch (error: any) {
    console.error('Error guardando caja:', error)
    // Manejar error de código duplicado
    if (error.code === 'P2002') {
      return { error: 'Ya existe una caja con ese código en esta sucursal.' }
    }
    return { error: error.message || 'Error al guardar la caja' }
  }
}

export async function toggleCajaAction(id: string, activa: boolean) {
  try {
    await verificarPermiso()
    await prisma.caja.update({
      where: { id },
      data: { activa },
    })
    revalidatePath('/configuracion/cajas')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}