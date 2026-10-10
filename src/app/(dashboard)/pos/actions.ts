'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ItemCarrito = {
  id: string
  productoId: string
  varianteId: string | null
  codigo: string
  nombre: string
  nombreVariante: string | null
  precioUnitario: number
  cantidad: number
  descuento: number
  tipoImpuesto: string
  notas: string
}

type CrearVentaPayload = {
  items: ItemCarrito[]
  metodoPagoId: string
  montoRecibido: number
  cambio: number
  bancoId?: string
  redTarjetaId?: string
  referencia?: string
  tasaCambio: number
}

type ResultadoVenta = {
  success: boolean
  error?: string
  venta?: {
    id: string
    numero: string
    facturaNumero: string
    facturaId: string
    total: number
    cambio: number
  }
}

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) throw new Error('Sin permisos')
  return session.user
}

// ============================================
// CREAR VENTA
// ============================================
export async function crearVentaAction(
  payload: CrearVentaPayload
): Promise<ResultadoVenta> {
  try {
    const user = await verificarPermiso('ventas:crear')

    if (!user.sucursalId) {
      return { success: false, error: 'Usuario sin sucursal asignada' }
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'La orden está vacía' }
    }

    const sucursalId = user.sucursalId

    // ============================================
    // 1. VALIDAR MÉTODO DE PAGO
    // ============================================
    const metodoPago = await prisma.metodoPago.findUnique({
      where: { id: payload.metodoPagoId },
      include: { moneda: true },
    })

    if (!metodoPago || !metodoPago.activo) {
      return { success: false, error: 'Método de pago no válido' }
    }

    if (metodoPago.requiereBanco && !payload.bancoId) {
      return { success: false, error: 'Debes seleccionar un banco' }
    }

    if (metodoPago.requiereRed && !payload.redTarjetaId) {
      return { success: false, error: 'Debes seleccionar la red de tarjeta' }
    }

    // ============================================
    // 2. CALCULAR TOTALES
    // ============================================
    let subtotal = 0
    let descuentoTotal = 0
    let ivaTotal = 0

    const itemsCalculados = payload.items.map((item) => {
      const bruto = item.precioUnitario * item.cantidad
      const descuento = (bruto * item.descuento) / 100
      const neto = bruto - descuento

      let iva = 0
      if (item.tipoImpuesto === 'GRAVADO_15') {
        iva = neto - neto / 1.15
      }

      subtotal += bruto
      descuentoTotal += descuento
      ivaTotal += iva

      return {
        ...item,
        subtotal: bruto,
        descuentoMonto: descuento,
        impuesto: iva,
        total: neto,
      }
    })

    const total = subtotal - descuentoTotal

    // ============================================
    // 3. GENERAR NÚMEROS CORRELATIVOS
    // ============================================
    const año = new Date().getFullYear()

    const ultimaVenta = await prisma.venta.findFirst({
      where: { sucursalId },
      orderBy: { numeroSucursal: 'desc' },
      select: { numeroSucursal: true },
    })
    const numeroVentaSucursal = (ultimaVenta?.numeroSucursal ?? 0) + 1
    const numeroVentaCompleto = `V-${año}-${String(numeroVentaSucursal).padStart(6, '0')}`

    const ultimaFactura = await prisma.factura.findFirst({
      where: { sucursalId },
      orderBy: { numeroSucursal: 'desc' },
      select: { numeroSucursal: true },
    })
    const numeroFacturaSucursal = (ultimaFactura?.numeroSucursal ?? 0) + 1

    const configSerie = await prisma.configuracion.findUnique({
      where: { clave: 'factura.serie' },
    })
    const serie = configSerie?.valor ?? 'A'
    const numeroFacturaCompleto = `${serie}-${String(numeroFacturaSucursal).padStart(6, '0')}`

    // ============================================
    // 4. CREAR VENTA + ITEMS + PAGO + FACTURA (TRANSACCIÓN)
    // ============================================
    const resultado = await prisma.$transaction(async (tx) => {
      // 4.1 Crear venta
      const venta = await tx.venta.create({
        data: {
          numero: numeroVentaCompleto,
          numeroSucursal: numeroVentaSucursal,
          tipo: metodoPago.esCredito ? 'CREDITO' : 'CONTADO',
          estado: 'COMPLETADA',
          subtotal,
          descuento: descuentoTotal,
          impuesto: ivaTotal,
          total,
          tasaCambio: payload.tasaCambio,
          totalEfectivoNio: metodoPago.codigo === 'EFECTIVO_NIO' ? total : 0,
          totalEfectivoUsd:
            metodoPago.codigo === 'EFECTIVO_USD' ? payload.montoRecibido : 0,
          totalTarjeta: metodoPago.codigo === 'TARJETA' ? total : 0,
          totalTransferencia: metodoPago.codigo === 'TRANSFERENCIA' ? total : 0,
          totalCredito: metodoPago.esCredito ? total : 0,
          sucursal: {
            connect: { id: sucursalId },
          },
          usuario: {
            connect: { id: user.id },
          },
        },
      })

      // 4.2 Crear items + descontar inventario
      for (const item of itemsCalculados) {
        await tx.itemVenta.create({
          data: {
            venta: { connect: { id: venta.id } },
            producto: { connect: { id: item.productoId } },
            variante: item.varianteId
              ? { connect: { id: item.varianteId } }
              : undefined,
            nombreProducto: item.nombre,
            nombreVariante: item.nombreVariante,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuentoMonto,
            subtotal: item.subtotal,
            impuesto: item.impuesto,
            total: item.total,
            tipoImpuesto: item.tipoImpuesto,
            notas: item.notas || null,
          },
        })

        // Descontar inventario según receta
        const receta = await tx.receta.findUnique({
          where: { productoId: item.productoId },
          include: { items: true },
        })

        if (receta && receta.activa) {
          for (const recetaItem of receta.items) {
            const cantidadConsumir =
              Number(recetaItem.cantidad) *
              item.cantidad *
              (1 + Number(recetaItem.mermaPorcentaje) / 100)

            const stock = await tx.stock.findFirst({
              where: {
                insumoId: recetaItem.insumoId,
                sucursalId,
              },
            })

            const cantidadAnterior = stock ? Number(stock.cantidad) : 0
            const cantidadNueva = Math.max(0, cantidadAnterior - cantidadConsumir)

            if (stock) {
              await tx.stock.update({
                where: { id: stock.id },
                data: { cantidad: cantidadNueva },
              })
            } else {
              await tx.stock.create({
                data: {
                  insumo: { connect: { id: recetaItem.insumoId } },
                  sucursal: { connect: { id: sucursalId } },
                  cantidad: 0,
                },
              })
            }

            await tx.movimientoInventario.create({
              data: {
                insumo: { connect: { id: recetaItem.insumoId } },
                sucursal: { connect: { id: sucursalId } },
                usuario: { connect: { id: user.id } },
                tipo: 'SALIDA_VENTA',
                cantidad: -cantidadConsumir,
                cantidadAnterior,
                cantidadNueva,
                referenciaTipo: 'venta',
                referenciaId: venta.id,
                motivo: `Venta ${numeroVentaCompleto}`,
              },
            })
          }
        }
      }

      // 4.3 Crear pago
      await tx.pagoVenta.create({
        data: {
          venta: { connect: { id: venta.id } },
          metodoPago: { connect: { id: metodoPago.id } },
          metodoCodigo: metodoPago.codigo,
          monto: payload.montoRecibido || total,
          montoNio:
            metodoPago.codigo === 'EFECTIVO_USD'
              ? payload.montoRecibido * payload.tasaCambio
              : total,
          tasaCambio:
            metodoPago.codigo === 'EFECTIVO_USD' ? payload.tasaCambio : null,
          banco: payload.bancoId
            ? { connect: { id: payload.bancoId } }
            : undefined,
          redTarjeta: payload.redTarjetaId
            ? { connect: { id: payload.redTarjetaId } }
            : undefined,
          referencia: payload.referencia || null,
        },
      })

      // 4.4 Crear factura
      const factura = await tx.factura.create({
        data: {
          serie,
          numero: numeroFacturaSucursal,
          numeroSucursal: numeroFacturaSucursal,
          numeroCompleto: numeroFacturaCompleto,
          venta: { connect: { id: venta.id } },
          sucursal: { connect: { id: sucursalId } },
          clienteNombre: 'Consumidor Final',
          tipoDocumento: 'FACTURA',
          subtotal,
          subtotalGravado: subtotal - descuentoTotal,
          subtotalExento: 0,
          descuento: descuentoTotal,
          iva: ivaTotal,
          total,
          estado: 'EMITIDA',
        },
      })

      // 4.5 Auditoría
      await tx.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'venta.crear',
          entidadTipo: 'Venta',
          entidadId: venta.id,
          datosDespues: {
            numero: numeroVentaCompleto,
            factura: numeroFacturaCompleto,
            total,
            metodoPago: metodoPago.codigo,
          } as any,
        },
      })

      return { venta, factura }
    })

    revalidatePath('/pos')
    revalidatePath('/inventario')

    return {
      success: true,
      venta: {
        id: resultado.venta.id,
        numero: resultado.venta.numero,
        facturaNumero: resultado.factura.numeroCompleto,
        facturaId: resultado.factura.id,
        total: Number(resultado.venta.total),
        cambio: payload.cambio,
      },
    }
  } catch (error) {
    console.error('Error creando venta:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Error al procesar la venta',
    }
  }
}