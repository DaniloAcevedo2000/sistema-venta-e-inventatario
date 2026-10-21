'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'
import {
  siguienteCorrelativo,
  formatNotaCredito,
} from '@/lib/helpers/correlativos'
import { devolverStockDeItems } from '@/lib/helpers/inventario'

type AnularVentaPayload = {
  ventaId: string
  motivo: string
  devolverAlInventario: boolean
  generarNotaCredito: boolean
  metodoDevolucion: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'SALDO_A_FAVOR'
  referenciaDevolucion?: string
}

type ResultadoAnulacion = {
  success: boolean
  error?: string
  notaCreditoNumero?: string
}

export async function anularVentaAction(
  payload: AnularVentaPayload
): Promise<ResultadoAnulacion> {
  try {
    const user = await requirePermiso('ventas:anular')

    // ============================================
    // 1. VALIDACIONES
    // ============================================
    if (!payload.motivo || payload.motivo.trim().length < 10) {
      return {
        success: false,
        error: 'El motivo debe tener al menos 10 caracteres',
      }
    }

    const venta = await prisma.venta.findUnique({
      where: { id: payload.ventaId },
      include: {
        items: true,
        factura: true,
        pagos: { include: { metodoPago: true } },
        sucursal: true,
      },
    })

    if (!venta) {
      return { success: false, error: 'Venta no encontrada' }
    }

    if (venta.estado === 'ANULADA') {
      return { success: false, error: 'Esta venta ya está anulada' }
    }

    // Solo mismo día salvo permiso especial
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fechaVenta = new Date(venta.creadoEn)
    fechaVenta.setHours(0, 0, 0, 0)

    const esDelMismoDia = fechaVenta.getTime() === hoy.getTime()

    if (!esDelMismoDia && !user.permisos.includes('ventas:anular_historico')) {
      return {
        success: false,
        error:
          'Solo se pueden anular ventas del mismo día. Para anular ventas anteriores necesitas autorización de SUPER_ADMIN.',
      }
    }

    // ============================================
    // 2. TRANSACCIÓN
    // ============================================
    const resultado = await prisma.$transaction(async (tx) => {
      // 2.1 Anular venta
      await tx.venta.update({
        where: { id: venta.id },
        data: {
          estado: 'ANULADA',
          anuladaEn: new Date(),
          anuladaPorId: user.id,
          motivoAnulacion: payload.motivo,
          devueltaAlInventario: payload.devolverAlInventario,
          montoDevuelto: venta.total,
          metodoDevolucion: payload.metodoDevolucion,
        },
      })

      // 2.2 Anular factura
      if (venta.factura) {
        await tx.factura.update({
          where: { id: venta.factura.id },
          data: {
            estado: 'ANULADA',
            anuladaEn: new Date(),
            anuladaPorId: user.id,
            motivoAnulacion: payload.motivo,
          },
        })
      }

      // 2.3 Devolver al inventario (helper unificado)
      // Cubre: productos con receta (insumos) Y productos sin receta
      // (stock directo del producto si variante.controlaStock = true)
      if (payload.devolverAlInventario) {
        await devolverStockDeItems({
          tx,
          items: venta.items.map((item) => ({
            productoId: item.productoId,
            varianteId: item.varianteId,
            cantidad: Number(item.cantidad),
            nombreProducto: item.nombreProducto,
          })),
          sucursalId: venta.sucursalId,
          usuarioId: user.id,
          referenciaTipo: 'venta_anulada',
          referenciaId: venta.id,
          motivo: `Anulación venta ${venta.numero}: ${payload.motivo}`,
        })
      }

      // 2.4 Crear Nota de Crédito (correlativo atómico)
      let notaCredito = null
      if (payload.generarNotaCredito && venta.factura) {
        const numNC = await siguienteCorrelativo(
          'NOTA_CREDITO',
          venta.sucursalId,
          tx
        )
        const numeroNCCompleto = formatNotaCredito(numNC, 'NATURA')

        notaCredito = await tx.notaCredito.create({
          data: {
            numero: numeroNCCompleto,
            numeroSucursal: numNC,
            facturaOriginal: { connect: { id: venta.factura.id } },
            venta: { connect: { id: venta.id } },
            sucursal: { connect: { id: venta.sucursalId } },
            motivo: payload.motivo,
            subtotal: venta.subtotal,
            subtotalExento: 0,
            subtotalGravado:
              Number(venta.subtotal) - Number(venta.descuento),
            descuento: venta.descuento,
            iva: venta.impuesto,
            total: venta.total,
            usuario: { connect: { id: user.id } },
            estado: 'EMITIDA',
          },
        })
      }

      // 2.5 Auditoría
      await tx.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'venta.anular',
          entidadTipo: 'Venta',
          entidadId: venta.id,
          datosAntes: {
            estado: 'COMPLETADA',
            total: Number(venta.total),
          } as any,
          datosDespues: {
            estado: 'ANULADA',
            motivo: payload.motivo,
            devueltaAlInventario: payload.devolverAlInventario,
            montoDevuelto: Number(venta.total),
            metodoDevolucion: payload.metodoDevolucion,
            referenciaDevolucion: payload.referenciaDevolucion || null,
            notaCredito: notaCredito?.numero ?? null,
          } as any,
        },
      })

      return { notaCredito }
    })

    revalidatePath('/ventas')
    revalidatePath('/inventario')
    revalidatePath('/dashboard')

    return {
      success: true,
      notaCreditoNumero: resultado.notaCredito?.numero,
    }
  } catch (error) {
    console.error('Error anulando venta:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Error al anular la venta',
    }
  }
}