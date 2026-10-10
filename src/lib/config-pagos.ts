import { prisma } from '@/lib/prisma'

// ============================================
// OBTENER TASA DE CAMBIO ACTUAL
// ============================================
export async function obtenerTasaCambio() {
  const tasa = await prisma.tasaCambio.findFirst({
    where: {
      monedaOrigen: 'USD',
      monedaDestino: 'NIO',
      activa: true,
    },
    orderBy: { vigenteDesde: 'desc' },
  })

  return tasa ? Number(tasa.tasa) : 36.6243
}

// ============================================
// OBTENER MÉTODOS DE PAGO ACTIVOS
// ============================================
export async function obtenerMetodosPago() {
  return prisma.metodoPago.findMany({
    where: { activo: true },
    include: {
      moneda: true,
    },
    orderBy: { orden: 'asc' },
  })
}

// ============================================
// OBTENER BANCOS ACTIVOS
// ============================================
export async function obtenerBancos() {
  return prisma.banco.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })
}

// ============================================
// OBTENER REDES DE TARJETA ACTIVAS
// ============================================
export async function obtenerRedesTarjeta() {
  return prisma.redTarjeta.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })
}

// ============================================
// OBTENER MONEDAS ACTIVAS
// ============================================
export async function obtenerMonedas() {
  return prisma.moneda.findMany({
    where: { activo: true },
    orderBy: [{ esBase: 'desc' }, { codigo: 'asc' }],
  })
}