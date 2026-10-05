import { z } from 'zod'

export const varianteSchema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(1, 'El código es requerido').max(20),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  precio: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  costo: z.coerce.number().min(0).default(0),
  orden: z.coerce.number().int().min(0).default(0),
  activo: z.boolean().default(true),
})

export const productoSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(30)
    .regex(/^[A-Z0-9-]+$/i, 'Solo letras, números y guiones'),
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  descripcion: z.string().max(500).optional().nullable(),
  categoriaId: z.string().min(1, 'La categoría es requerida'),
  
  tipo: z.enum(['simple', 'variantes', 'combo']).default('simple'),
  
  precioBase: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  costo: z.coerce.number().min(0).default(0),
  
  tipoImpuesto: z.enum(['GRAVADO_15', 'EXENTO', 'EXCLUIDO']).default('GRAVADO_15'),
  
  // Campos opcionales que aceptan string vacío
  imagenUrl: z.string().optional().nullable().transform((v) => v || null),
  color: z.string().max(20).optional().nullable().transform((v) => v || null),
  codigoBarras: z.string().max(50).optional().nullable().transform((v) => v || null),
  
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  permiteDescuento: z.boolean().default(true),
  
  orden: z.coerce.number().int().min(0).default(0),
  
  variantes: z.array(varianteSchema).optional(),
})

export type ProductoFormData = z.infer<typeof productoSchema>
export type VarianteFormData = z.infer<typeof varianteSchema>