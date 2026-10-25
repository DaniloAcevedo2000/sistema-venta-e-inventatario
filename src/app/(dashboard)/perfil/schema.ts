import { z } from 'zod'

export const perfilSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  telefono: z
    .string()
    .min(1, 'El teléfono es requerido')
    .regex(/^\+[1-9]\d{1,14}$/, 'Formato de teléfono inválido'),
  biografia: z
    .string()
    .max(200, 'La biografía no puede exceder 200 caracteres')
    .optional()
    .transform((v) => v || null),
})

export const passwordSchema = z.object({
  actual: z.string().min(1, 'La contraseña actual es requerida'),
  nueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmar: z.string().min(1, 'Debes confirmar la contraseña'),
}).refine((data) => data.nueva === data.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
})

export type PerfilFormData = z.infer<typeof perfilSchema>
export type PasswordFormData = z.infer<typeof passwordSchema>