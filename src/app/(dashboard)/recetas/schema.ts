import { z } from 'zod'

export const recetaItemSchema = z.object({
  id: z.string().optional(),
  insumoId: z.string().min(1, 'El insumo es requerido'),
  cantidad: z.coerce.number().min(0.0001, 'La cantidad debe ser mayor a 0'),
  unidadMedidaId: z.string().min(1, 'La unidad es requerida'),
  mermaPorcentaje: z.coerce.number().min(0).max(100).default(0),
})

export const recetaSchema = z.object({
  productoId: z.string().min(1, 'El producto es requerido'),
  notas: z.string().max(500).optional().nullable(),
  activa: z.boolean().default(true),
  items: z
    .array(recetaItemSchema)
    .min(1, 'Debe agregar al menos un insumo'),
})

export type RecetaFormData = z.infer<typeof recetaSchema>
export type RecetaItemFormData = z.infer<typeof recetaItemSchema>