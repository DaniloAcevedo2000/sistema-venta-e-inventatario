'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

async function verificarPermiso(permiso: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')
  if (!session.user.permisos.includes(permiso)) throw new Error('Sin permisos')
  return session.user
}

// ============================================
// ANULAR VENTA
// ============================================
export async function anularVentaAction(
  payload: AnularVentaPayload
): Promise<ResultadoAnulacion> {
  try {
    const user = await verificarPermiso('ventas:anular')

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
        pagos: {
          include: {
            metodoPago: true,
          },
        },
        sucursal: true,
      },
    })

    if (!venta) {
      return { success: false, error: 'Venta no encontrada' }
    }

    if (venta.estado === 'ANULADA') {
      return { success: false, error: 'Esta venta ya está anulada' }
    }

    // Verificar que sea del mismo día
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fechaVenta = new Date(venta.creadoEn)
    fechaVenta.setHours(0, 0, 0, 0)

    const esDelMismoDia = fechaVenta.getTime() === hoy.getTime()

    if (!esDelMismoDia) {
      // Verificar permiso especial
      if (!user.permisos.includes('ventas:anular_historico')) {
        return {
          success: false,
          error:
            'Solo se pueden anular ventas del mismo día. Para anular ventas anteriores necesitas autorización de SUPER_ADMIN.',
        }
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

      // 2.3 Devolver al inventario (si aplica)
      if (payload.devolverAlInventario) {
        for (const item of venta.items) {
          // Verificar si el producto tiene receta
          const receta = await tx.receta.findUnique({
            where: { productoId: item.productoId },
            include: { items: true },
          })

          if (receta && receta.activa) {
            // Devolver insumos al stock
            for (const recetaItem of receta.items) {
              const cantidadDevolver =
                Number(recetaItem.cantidad) *
                Number(item.cantidad) *
                (1 + Number(recetaItem.mermaPorcentaje) / 100)

              const stock = await tx.stock.findFirst({
                where: {
                  insumoId: recetaItem.insumoId,
                  sucursalId: venta.sucursalId,
                },
              })

              const cantidadAnterior = stock ? Number(stock.cantidad) : 0
              const cantidadNueva = cantidadAnterior + cantidadDevolver

              if (stock) {
                await tx.stock.update({
                  where: { id: stock.id },
                  data: { cantidad: cantidadNueva },
                })
              } else {
                await tx.stock.create({
                  data: {
                    insumo: { connect: { id: recetaItem.insumoId } },
                    sucursal: { connect: { id: venta.sucursalId } },
                    cantidad: cantidadDevolver,
                  },
                })
              }

              await tx.movimientoInventario.create({
                data: {
                  insumo: { connect: { id: recetaItem.insumoId } },
                  sucursal: { connect: { id: venta.sucursalId } },
                  usuario: { connect: { id: user.id } },
                  tipo: 'ENTRADA_ANULACION',
                  cantidad: cantidadDevolver,
                  cantidadAnterior,
                  cantidadNueva,
                  referenciaTipo: 'venta_anulada',
                  referenciaId: venta.id,
                  motivo: `Anulación venta ${venta.numero}: ${payload.motivo}`,
                },
              })
            }
          } else {
            // Producto sin receta (se vende directo): devolver stock del producto
            const stockProducto = await tx.stock.findFirst({
              where: {
                productoId: item.productoId,
                sucursalId: venta.sucursalId,
              },
            })

            const cantidadAnterior = stockProducto
              ? Number(stockProducto.cantidad)
              : 0
            const cantidadNueva = cantidadAnterior + Number(item.cantidad)

            if (stockProducto) {
              await tx.stock.update({
                where: { id: stockProducto.id },
                data: { cantidad: cantidadNueva },
              })
            } else {
              await tx.stock.create({
                data: {
                  producto: { connect: { id: item.productoId } },
                  sucursal: { connect: { id: venta.sucursalId } },
                  cantidad: Number(item.cantidad),
                },
              })
            }

            await tx.movimientoInventario.create({
              data: {
                producto: { connect: { id: item.productoId } },
                sucursal: { connect: { id: venta.sucursalId } },
                usuario: { connect: { id: user.id } },
                tipo: 'ENTRADA_ANULACION',
                cantidad: Number(item.cantidad),
                cantidadAnterior,
                cantidadNueva,
                referenciaTipo: 'venta_anulada',
                referenciaId: venta.id,
                motivo: `Anulación venta ${venta.numero}: ${payload.motivo}`,
              },
            })
          }
        }
      }

      // 2.4 Crear Nota de Crédito (si aplica)
      let notaCredito = null
      if (payload.generarNotaCredito && venta.factura) {
        const año = new Date().getFullYear()
        const ultimaNC = await tx.notaCredito.findFirst({
          where: { sucursalId: venta.sucursalId },
          orderBy: { numeroSucursal: 'desc' },
          select: { numeroSucursal: true },
        })
        const numeroNCSucursal = (ultimaNC?.numeroSucursal ?? 0) + 1
        const numeroNCCompleto = `NC-${año}-${String(numeroNCSucursal).padStart(6, '0')}`

        notaCredito = await tx.notaCredito.create({
          data: {
            numero: numeroNCCompleto,
            numeroSucursal: numeroNCSucursal,
            facturaOriginal: { connect: { id: venta.factura.id } },
            venta: { connect: { id: venta.id } },
            sucursal: { connect: { id: venta.sucursalId } },
            motivo: payload.motivo,
            subtotal: venta.subtotal,
            subtotalExento: 0,
            subtotalGravado: Number(venta.subtotal) - Number(venta.descuento),
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