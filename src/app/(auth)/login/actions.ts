'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
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

export async function loginAction(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const rawData = {
    correo: formData.get('correo') as string,
    contrasena: formData.get('contrasena') as string,
  }

  // Validar con Zod
  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await signIn('credentials', {
      correo: parsed.data.correo.toLowerCase(),
      contrasena: parsed.data.contrasena,
      redirectTo: '/dashboard',
    })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Correo o contraseña incorrectos' }
        default:
          return { error: 'Error al iniciar sesión. Intenta de nuevo.' }
      }
    }
    throw error
  }
}