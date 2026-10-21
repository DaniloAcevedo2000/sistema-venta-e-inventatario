import 'server-only'
import { prisma } from '@/lib/prisma'

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

// ============================================
// TIPOS
// ============================================

type MovimientoTipo =
  | 'ENTRADA_COMPRA'
  | 'SALIDA_VENTA'
  | 'ENTRADA_ANULACION'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'MERMA'
  | 'TRANSFERENCIA_SALIDA'
  | 'TRANSFERENCIA_ENTRADA'
  | 'INVENTARIO_INICIAL'
  | 'AJUSTE_MANUAL'

type AplicarMovimientoInput = {
  tx: PrismaTx
  productoId?: string | null
  insumoId?: string | null
  sucursalId: string
  /** Positivo = entrada, negativo = salida */
  cantidad: number
  tipo: MovimientoTipo
  usuarioId: string
  referenciaTipo: string
  referenciaId: string
  motivo: string
  /** Si true, permite stock negativo. Default: false */
  permitirNegativo?: boolean
}

export type ItemStock = {
  productoId: string
  varianteId: string | null
  cantidad: number
  nombreProducto: string
}

// ============================================
// PRIMITIVA: aplicar un movimiento de stock
// ============================================
/**
 * Aplica un movimiento de stock y registra el kardex.
 * - cantidad > 0 => entrada
 * - cantidad < 0 => salida
 * Lanza error si deja stock negativo y permitirNegativo=false.
 */
export async function aplicarMovimientoStock(input: AplicarMovimientoInput) {
  const {
    tx,
    productoId,
    insumoId,
    sucursalId,
    cantidad,
    tipo,
    usuarioId,
    referenciaTipo,
    referenciaId,
    motivo,
    permitirNegativo = false,
  } = input

  if (cantidad === 0) return

  if (!productoId && !insumoId) {
    throw new Error('Debe especificar productoId o insumoId')
  }
  if (productoId && insumoId) {
    throw new Error('No puede especificar productoId e insumoId a la vez')
  }

  const stock = await tx.stock.findFirst({
    where: {
      sucursalId,
      ...(productoId ? { productoId } : {}),
      ...(insumoId ? { insumoId } : {}),
    },
  })

  const cantidadAnterior = Number(stock?.cantidad ?? 0)
  const cantidadNueva = cantidadAnterior + cantidad

  if (cantidadNueva < 0 && !permitirNegativo) {
    let nombre = 'ítem desconocido'
    if (insumoId) {
      const insumo = await tx.insumo.findUnique({
        where: { id: insumoId },
        select: { nombre: true },
      })
      nombre = insumo?.nombre ?? nombre
    } else if (productoId) {
      const producto = await tx.producto.findUnique({
        where: { id: productoId },
        select: { nombre: true },
      })
      nombre = producto?.nombre ?? nombre
    }

    throw new Error(
      `Stock insuficiente de "${nombre}". ` +
        `Disponible: ${cantidadAnterior.toFixed(2)}, ` +
        `requerido: ${Math.abs(cantidad).toFixed(2)}`
    )
  }

  if (stock) {
    await tx.stock.update({
      where: { id: stock.id },
      data: { cantidad: cantidadNueva },
    })
  } else {
    await tx.stock.create({
      data: {
        sucursalId,
        ...(productoId ? { productoId } : {}),
        ...(insumoId ? { insumoId } : {}),
        cantidad: cantidadNueva,
      },
    })
  }

  await tx.movimientoInventario.create({
    data: {
      ...(productoId ? { productoId } : {}),
      ...(insumoId ? { insumoId } : {}),
      sucursalId,
      usuarioId,
      tipo,
      cantidad,
      cantidadAnterior,
      cantidadNueva,
      referenciaTipo,
      referenciaId,
      motivo,
    },
  })
}

// ============================================
// RESOLVER RECETA
// ============================================
/**
 * Devuelve la receta activa del producto (con sus items), o null.
 * NOTA: el schema tiene `productoId @unique` en Receta → 1 receta por producto.
 */
export async function obtenerRecetaActiva(tx: PrismaTx, productoId: string) {
  return await tx.receta.findUnique({
    where: { productoId },
    include: { items: true },
  })
}

// ============================================
// DESCUENTO DE STOCK (venta / pedido confirmado)
// ============================================
/**
 * Descuenta stock de un conjunto de items.
 * - Producto con receta activa → descuenta cada insumo (con merma).
 * - Producto sin receta + variante.controlaStock=true → descuenta el producto.
 * - Producto sin receta + variante.controlaStock=false → no toca stock.
 */
export async function descontarStockDeItems(params: {
  tx: PrismaTx
  items: ItemStock[]
  sucursalId: string
  usuarioId: string
  referenciaTipo: string
  referenciaId: string
  motivo: string
  permitirNegativo?: boolean
}) {
  const {
    tx,
    items,
    sucursalId,
    usuarioId,
    referenciaTipo,
    referenciaId,
    motivo,
    permitirNegativo = false,
  } = params

  for (const item of items) {
    const cantidad = Number(item.cantidad)
    if (cantidad <= 0) continue

    const receta = await obtenerRecetaActiva(tx, item.productoId)

    if (receta && receta.activa && receta.items.length > 0) {
      for (const recetaItem of receta.items) {
        const cantidadConsumir =
          Number(recetaItem.cantidad) *
          cantidad *
          (1 + Number(recetaItem.mermaPorcentaje) / 100)

        await aplicarMovimientoStock({
          tx,
          insumoId: recetaItem.insumoId,
          sucursalId,
          cantidad: -cantidadConsumir,
          tipo: 'SALIDA_VENTA',
          usuarioId,
          referenciaTipo,
          referenciaId,
          motivo: `${motivo} (receta)`,
          permitirNegativo,
        })
      }
      continue
    }

    const variante = item.varianteId
      ? await tx.productoVariante.findUnique({
          where: { id: item.varianteId },
          select: { controlaStock: true },
        })
      : null

    const controlaStock = variante?.controlaStock ?? true

    if (controlaStock) {
      await aplicarMovimientoStock({
        tx,
        productoId: item.productoId,
        sucursalId,
        cantidad: -cantidad,
        tipo: 'SALIDA_VENTA',
        usuarioId,
        referenciaTipo,
        referenciaId,
        motivo: `${motivo} (producto simple)`,
        permitirNegativo,
      })
    }
  }
}

// ============================================
// DEVOLUCIÓN DE STOCK (anulación / cancelación)
// ============================================
/**
 * Revierte el stock de un conjunto de items previamente descontados.
 * Misma lógica que `descontarStockDeItems` pero sumando stock.
 */
export async function devolverStockDeItems(params: {
  tx: PrismaTx
  items: ItemStock[]
  sucursalId: string
  usuarioId: string
  referenciaTipo: string
  referenciaId: string
  motivo: string
}) {
  const {
    tx,
    items,
    sucursalId,
    usuarioId,
    referenciaTipo,
    referenciaId,
    motivo,
  } = params

  for (const item of items) {
    const cantidad = Number(item.cantidad)
    if (cantidad <= 0) continue

    const receta = await obtenerRecetaActiva(tx, item.productoId)

    if (receta && receta.activa && receta.items.length > 0) {
      for (const recetaItem of receta.items) {
        const cantidadDevolver =
          Number(recetaItem.cantidad) *
          cantidad *
          (1 + Number(recetaItem.mermaPorcentaje) / 100)

        await aplicarMovimientoStock({
          tx,
          insumoId: recetaItem.insumoId,
          sucursalId,
          cantidad: cantidadDevolver,
          tipo: 'ENTRADA_ANULACION',
          usuarioId,
          referenciaTipo,
          referenciaId,
          motivo: `${motivo} (receta)`,
        })
      }
      continue
    }

    const variante = item.varianteId
      ? await tx.productoVariante.findUnique({
          where: { id: item.varianteId },
          select: { controlaStock: true },
        })
      : null

    const controlaStock = variante?.controlaStock ?? true

    if (controlaStock) {
      await aplicarMovimientoStock({
        tx,
        productoId: item.productoId,
        sucursalId,
        cantidad,
        tipo: 'ENTRADA_ANULACION',
        usuarioId,
        referenciaTipo,
        referenciaId,
        motivo: `${motivo} (producto simple)`,
      })
    }
  }
}