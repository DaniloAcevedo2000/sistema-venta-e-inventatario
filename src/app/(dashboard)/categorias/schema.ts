import { z } from 'zod'

export const categoriaSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(30)
    .regex(/^[A-Z0-9-]+$/i, 'Solo letras, números y guiones'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  descripcion: z.string().max(300).optional().nullable(),
  padreId: z.string().optional().nullable(),
  icono: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  orden: z.coerce.number().int().min(0).default(0),
  activo: z.boolean().default(true),
})

export type CategoriaFormData = z.infer<typeof categoriaSchema>