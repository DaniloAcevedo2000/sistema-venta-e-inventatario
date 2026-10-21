import 'server-only'
import { prisma } from '@/lib/prisma'

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
type ClientLike = typeof prisma | PrismaTx

type TipoCorrelativo = 'VENTA' | 'FACTURA' | 'PEDIDO' | 'NOTA_CREDITO'

/**
 * Devuelve el siguiente correlativo atómico por sucursal y tipo.
 */
export async function siguienteCorrelativo(
  tipo: TipoCorrelativo,
  sucursalId: string,
  client: ClientLike = prisma
): Promise<number> {
  switch (tipo) {
    case 'VENTA':
      return await siguienteCorrelativoVenta(client, sucursalId)
    case 'FACTURA':
      return await siguienteCorrelativoFactura(client, sucursalId)
    case 'PEDIDO':
      return await siguienteCorrelativoPedido(client, sucursalId)
    case 'NOTA_CREDITO':
      return await siguienteCorrelativoNotaCredito(client, sucursalId)
  }
}

// ============================================
// Implementación por tabla
// ============================================

async function siguienteCorrelativoVenta(client: ClientLike, sucursalId: string): Promise<number> {
  const rows = await client.$queryRaw<{ numero: number }[]>`
    SELECT COALESCE(MAX(numero_sucursal), 0) + 1 AS numero
    FROM ventas WHERE sucursal_id = ${sucursalId}
  `
  return Number(rows[0].numero)
}

async function siguienteCorrelativoFactura(client: ClientLike, sucursalId: string): Promise<number> {
  const rows = await client.$queryRaw<{ numero: number }[]>`
    SELECT COALESCE(MAX(numero_sucursal), 0) + 1 AS numero
    FROM facturas WHERE sucursal_id = ${sucursalId}
  `
  return Number(rows[0].numero)
}

async function siguienteCorrelativoPedido(client: ClientLike, sucursalId: string): Promise<number> {
  const rows = await client.$queryRaw<{ numero: number }[]>`
    SELECT COALESCE(MAX(numero_sucursal), 0) + 1 AS numero
    FROM pedidos WHERE sucursal_id = ${sucursalId}
  `
  return Number(rows[0].numero)
}

async function siguienteCorrelativoNotaCredito(client: ClientLike, sucursalId: string): Promise<number> {
  const rows = await client.$queryRaw<{ numero: number }[]>`
    SELECT COALESCE(MAX(numero_sucursal), 0) + 1 AS numero
    FROM notas_credito WHERE sucursal_id = ${sucursalId}
  `
  return Number(rows[0].numero)
}

// ============================================
// FORMATEADORES (Con código de sucursal)
// ============================================

/** "V-ALDEAS-2026-000001" */
export function formatVenta(numero: number, sucursalCodigo: string, año = new Date().getFullYear()) {
  return `V-${sucursalCodigo}-${año}-${String(numero).padStart(6, '0')}`
}

/** "ALDEAS-A-000001" */
export function formatFactura(serie: string, numero: number, sucursalCodigo: string, padding = 6) {
  return `${sucursalCodigo}-${serie}-${String(numero).padStart(padding, '0')}`
}

/** "P-ALDEAS-2026-000001" */
export function formatPedido(numero: number, sucursalCodigo: string, año = new Date().getFullYear()) {
  return `P-${sucursalCodigo}-${año}-${String(numero).padStart(6, '0')}`
}

/** "NC-ALDEAS-2026-000001" */
export function formatNotaCredito(numero: number, sucursalCodigo: string, año = new Date().getFullYear()) {
  return `NC-${sucursalCodigo}-${año}-${String(numero).padStart(6, '0')}`
}