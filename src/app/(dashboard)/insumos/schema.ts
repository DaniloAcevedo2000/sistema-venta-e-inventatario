import { z } from 'zod'

export const CATEGORIAS_INSUMO = [
  { value: 'cafe', label: 'Café' },
  { value: 'lacteos', label: 'Lácteos' },
  { value: 'endulzantes', label: 'Endulzantes y Sabores' },
  { value: 'desechables', label: 'Desechables' },
  { value: 'reposteria', label: 'Repostería' },
  { value: 'te', label: 'Tés e Infusiones' },
  { value: 'jugos', label: 'Jugos y Frutas' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'otros', label: 'Otros' },
] as const

export const insumoSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(30)
    .regex(/^[A-Z0-9-]+$/i, 'Solo letras, números y guiones'),
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  descripcion: z.string().max(500).optional().nullable(),
  unidadMedidaId: z.string().min(1, 'La unidad es requerida'),
  categoriaInsumo: z.string().min(1, 'La categoría es requerida'),
  costoUnitario: z.coerce.number().min(0, 'El costo debe ser mayor o igual a 0'),
  stockMinimo: z.coerce.number().min(0).default(0),
  imagenUrl: z.string().optional().nullable(),
  activo: z.boolean().default(true),
})

export type InsumoFormData = z.infer<typeof insumoSchema>

export const actualizacionMasivaSchema = z.object({
  insumoIds: z.array(z.string()).min(1, 'Selecciona al menos un insumo'),
  tipo: z.enum(['porcentaje', 'monto_fijo']),
  valor: z.coerce.number(),
  operacion: z.enum(['aumentar', 'disminuir', 'establecer']),
})