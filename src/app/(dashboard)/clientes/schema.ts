import { z } from 'zod'

export const clienteSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(30)
    .regex(/^[A-Z0-9-]+$/i, 'Solo letras, números y guiones'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().max(100).optional().nullable(),
  nombreComercial: z.string().max(150).optional().nullable(),

  tipoDocumento: z
    .enum(['CEDULA', 'RUC', 'PASAPORTE', 'NINGUNO'])
    .optional()
    .nullable(),
  numeroDocumento: z.string().max(50).optional().nullable(),

  telefono: z.string().max(20).optional().nullable(),
  correo: z
    .string()
    .email('Correo inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  direccion: z.string().max(300).optional().nullable(),

  permiteCredito: z.boolean().default(false),
  limiteCredito: z.coerce.number().min(0).default(0),

  notas: z.string().max(500).optional().nullable(),
  activo: z.boolean().default(true),
})

export const abonoSchema = z.object({
  monto: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']),
  referencia: z.string().max(50).optional().nullable(),
  notas: z.string().max(300).optional().nullable(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>
export type AbonoFormData = z.infer<typeof abonoSchema>