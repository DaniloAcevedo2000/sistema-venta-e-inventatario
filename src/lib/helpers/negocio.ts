import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Coordenadas del negocio (para mapas de delivery).
 * Cachea por request.
 */
export const getCoordsNegocio = cache(async () => {
  const config = await prisma.configuracion.findMany({
    where: {
      clave: { in: ['negocio.latitud', 'negocio.longitud'] },
    },
  })

  const latitudNegocio = parseFloat(
    config.find((c) => c.clave === 'negocio.latitud')?.valor ?? '0'
  )
  const longitudNegocio = parseFloat(
    config.find((c) => c.clave === 'negocio.longitud')?.valor ?? '0'
  )

  return {
    latitudNegocio,
    longitudNegocio,
    tieneCoords: latitudNegocio !== 0 && longitudNegocio !== 0,
  }
})

/**
 * Tasa de cambio USD -> NIO activa.
 * Fallback 36.6243 si no hay ninguna registrada.
 */
export const getTasaCambioActiva = cache(async () => {
  const tasa = await prisma.tasaCambio.findFirst({
    where: {
      monedaOrigen: 'USD',
      monedaDestino: 'NIO',
      activa: true,
    },
    orderBy: { vigenteDesde: 'desc' },
  })

  return tasa ? Number(tasa.tasa) : 36.6243
})

/**
 * Serie de facturación (config `factura.serie`). Default "A".
 */
export const getSerieFactura = cache(async () => {
  const config = await prisma.configuracion.findUnique({
    where: { clave: 'factura.serie' },
  })
  return config?.valor ?? 'A'
})

/**
 * Sesión de caja ABIERTA del usuario.
 * Devuelve null si no hay ninguna abierta.
 */
export const getSesionCajaAbierta = cache(async (usuarioId: string) => {
  return await prisma.sesionCaja.findFirst({
    where: {
      usuarioAperturaId: usuarioId,
      estado: 'ABIERTA',
    },
    include: { caja: true },
    orderBy: { fechaApertura: 'desc' },
  })
})

/**
 * Obtiene el código de la sucursal (ej: "ALDEAS", "NATURA").
 * Útil para los correlativos.
 */
export const getCodigoSucursal = cache(async (sucursalId: string) => {
  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { codigo: true },
  })
  return sucursal?.codigo ?? 'SUC'
})