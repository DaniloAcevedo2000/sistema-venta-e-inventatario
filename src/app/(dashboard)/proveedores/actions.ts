'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'
import { z } from 'zod'

const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  nombreComercial: z.string().optional().nullable(),
  ruc: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')).nullable(),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
})

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function crearProveedorAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    await requirePermiso('compras:crear')

    const raw = {
      nombre: formData.get('nombre') as string,
      nombreComercial: (formData.get('nombreComercial') as string) || null,
      ruc: (formData.get('ruc') as string) || null,
      telefono: (formData.get('telefono') as string) || null,
      correo: (formData.get('correo') as string) || null,
      direccion: (formData.get('direccion') as string) || null,
      notas: (formData.get('notas') as string) || null,
    }

    const parsed = proveedorSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const count = await prisma.proveedor.count()
    const codigo = `PROV-${String(count + 1).padStart(3, '0')}`

    await prisma.proveedor.create({
      data: { ...parsed.data, codigo }
    })

    revalidatePath('/proveedores')
  } catch (error: any) {
    console.error(error) // Para que veas el error real en tu consola si algo falla
    return { error: error.message || 'Error al crear proveedor' }
  }

  // El redirect SIEMPRE debe ir aquí, fuera del bloque try/catch
  redirect('/proveedores')
}

export async function actualizarProveedorAction(
  id: string,
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  try {
    await requirePermiso('compras:editar')

    const raw = {
      nombre: formData.get('nombre') as string,
      nombreComercial: (formData.get('nombreComercial') as string) || null,
      ruc: (formData.get('ruc') as string) || null,
      telefono: (formData.get('telefono') as string) || null,
      correo: (formData.get('correo') as string) || null,
      direccion: (formData.get('direccion') as string) || null,
      notas: (formData.get('notas') as string) || null,
    }

    const parsed = proveedorSchema.safeParse(raw)
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    await prisma.proveedor.update({
      where: { id },
      data: parsed.data
    })

    revalidatePath('/proveedores')
  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Error al actualizar proveedor' }
  }

  redirect('/proveedores')
}

export async function toggleActivoProveedorAction(id: string, activo: boolean) {
  try {
    await requirePermiso('compras:editar')
    await prisma.proveedor.update({ where: { id }, data: { activo } })
    revalidatePath('/proveedores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}