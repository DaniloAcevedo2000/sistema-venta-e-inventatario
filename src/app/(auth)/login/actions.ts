'use server'

import { z } from 'zod'

const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(1, 'La contraseña es requerida'),
})

export type LoginState = {
  error?: string
  fieldErrors?: {
    correo?: string[]
    contrasena?: string[]
  }
}

export async function validarCredenciales(prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const rawData = {
    correo: formData.get('correo') as string,
    contrasena: formData.get('contrasena') as string,
  }

  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  return {}
}