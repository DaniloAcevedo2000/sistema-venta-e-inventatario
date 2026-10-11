import { z } from 'zod'

export const itemPedidoSchema = z.object({
  productoId: z.string().min(1),
  varianteId: z.string().optional().nullable(),
  nombreProducto: z.string(),
  nombreVariante: z.string().optional().nullable(),
  cantidad: z.coerce.number().min(1),
  precioUnitario: z.coerce.number().min(0),
  descuento: z.coerce.number().min(0).max(100).default(0),
  tipoImpuesto: z.string().default('GRAVADO_15'),
  notas: z.string().optional().nullable(),
})

export const pedidoSchema = z.object({
  tipo: z.enum(['DELIVERY', 'PICKUP']),
  clienteId: z.string().optional().nullable(),
  clienteNombre: z.string().min(1, 'El nombre es requerido'),
  clienteTelefono: z.string().min(1, 'El teléfono es requerido'),
  clienteDireccion: z.string().optional().nullable(),
  zonaEntregaId: z.string().optional().nullable(),
  fechaProgramada: z.string().optional().nullable(),

  // Coordenadas ← IMPORTANTE
  latitud: z.coerce.number().optional().nullable(),
  longitud: z.coerce.number().optional().nullable(),

  items: z.array(itemPedidoSchema).min(1, 'Agrega al menos un producto'),
  notas: z.string().optional().nullable(),
  notasInternas: z.string().optional().nullable(),
})