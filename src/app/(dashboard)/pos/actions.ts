'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'
import {
  siguienteCorrelativo,
  formatVenta,
  formatFactura,
} from '@/lib/helpers/correlativos'
import { descontarStockDeItems } from '@/lib/helpers/inventario'
import {
  getTasaCambioActiva,
  getSerieFactura,
  getSesionCajaAbierta,
  getCodigoSucursal,
} from '@/lib/helpers/negocio'
import { crearNotificacion } from '@/lib/notificaciones'

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
  /** Opcional: si no se pasa, se lee la tasa activa desde TasaCambio */
  tasaCambio?: number
  sesionCajaId?: string
  clienteId?: string
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

export async function crearVentaAction(
  payload: CrearVentaPayload
): Promise<ResultadoVenta> {
  try {
    const user = await requirePermiso('ventas:crear')

    if (!user.sucursalId) {
      return { success: false, error: 'Usuario sin sucursal asignada' }
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'La orden está vacía' }
    }

    const sucursalId = user.sucursalId

    // ============================================
    // 1. SESIÓN DE CAJA
    // ============================================
    let sesionCajaId = payload.sesionCajaId
    if (!sesionCajaId) {
      const sesion = await getSesionCajaAbierta(user.id)
      if (!sesion) {
        return { success: false, error: 'No tienes una caja abierta.' }
      }
      sesionCajaId = sesion.id
    }

    // ============================================
    // 2. MÉTODO DE PAGO
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
    // 3. CÁLCULO DE TOTALES
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
    // 4. CLIENTE Y CRÉDITO
    // ============================================
    let cliente: any = null
    if (metodoPago.esCredito) {
      if (!payload.clienteId) {
        return {
          success: false,
          error: 'Debes seleccionar un cliente para venta a crédito',
        }
      }

      cliente = await prisma.cliente.findUnique({
        where: { id: payload.clienteId },
      })

      if (!cliente || !cliente.activo) {
        return { success: false, error: 'Cliente no válido o inactivo' }
      }
      if (!cliente.permiteCredito) {
        return {
          success: false,
          error: 'El cliente no tiene crédito habilitado',
        }
      }

      const saldoActual = Number(cliente.saldoActual)
      const limite = Number(cliente.limiteCredito)
      const disponible = limite - saldoActual

      if (disponible < total) {
        return {
          success: false,
          error: `El cliente solo tiene C$ ${disponible.toFixed(2)} disponibles. Esta venta es de C$ ${total.toFixed(2)}.`,
        }
      }
    } else if (payload.clienteId) {
      cliente = await prisma.cliente.findUnique({
        where: { id: payload.clienteId },
      })
    }

    // ============================================
    // 5. TASA DE CAMBIO, SERIE Y CÓDIGO SUCURSAL
    // ============================================
    const tasaCambio = payload.tasaCambio ?? (await getTasaCambioActiva())
    const serie = await getSerieFactura()
    const sucursalCodigo = await getCodigoSucursal(sucursalId) // 👈 Obtenemos el código

    // ============================================
    // 6. TRANSACCIÓN
    // ============================================
    const resultado = await prisma.$transaction(async (tx) => {
      // 6.1 Correlativos atómicos (sin race condition)
      const numVenta = await siguienteCorrelativo('VENTA', sucursalId, tx)
      const numFactura = await siguienteCorrelativo('FACTURA', sucursalId, tx)

      // 👈 Usamos el código de la sucursal en el formato
      const numeroVentaCompleto = formatVenta(numVenta, sucursalCodigo)
      const numeroFacturaCompleto = formatFactura(serie, numFactura, sucursalCodigo)

      // 6.2 Crear venta
      const venta = await tx.venta.create({
        data: {
          numero: numeroVentaCompleto,
          numeroSucursal: numVenta,
          tipo: metodoPago.esCredito ? 'CREDITO' : 'CONTADO',
          estado: 'COMPLETADA',
          subtotal,
          descuento: descuentoTotal,
          impuesto: ivaTotal,
          total,
          tasaCambio,
          totalEfectivoNio: metodoPago.codigo === 'EFECTIVO_NIO' ? total : 0,
          totalEfectivoUsd:
            metodoPago.codigo === 'EFECTIVO_USD' ? payload.montoRecibido : 0,
          totalTarjeta: metodoPago.codigo === 'TARJETA' ? total : 0,
          totalTransferencia:
            metodoPago.codigo === 'TRANSFERENCIA' ? total : 0,
          totalCredito: metodoPago.esCredito ? total : 0,
          sucursal: { connect: { id: sucursalId } },
          usuario: { connect: { id: user.id } },
          sesionCaja: { connect: { id: sesionCajaId! } },
          ...(cliente && { cliente: { connect: { id: cliente.id } } }),
        },
      })

      // 6.3 Items de venta
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
      }

      // 6.4 Descontar stock — HELPER UNIFICADO
      await descontarStockDeItems({
        tx,
        items: itemsCalculados.map((i) => ({
          productoId: i.productoId,
          varianteId: i.varianteId,
          cantidad: i.cantidad,
          nombreProducto: i.nombre,
        })),
        sucursalId,
        usuarioId: user.id,
        referenciaTipo: 'venta',
        referenciaId: venta.id,
        motivo: `Venta ${numeroVentaCompleto}`,
      })

      // 6.5 Pago
      await tx.pagoVenta.create({
        data: {
          venta: { connect: { id: venta.id } },
          metodoPago: { connect: { id: metodoPago.id } },
          metodoCodigo: metodoPago.codigo,
          monto: payload.montoRecibido || total,
          montoNio:
            metodoPago.codigo === 'EFECTIVO_USD'
              ? payload.montoRecibido * tasaCambio
              : total,
          tasaCambio:
            metodoPago.codigo === 'EFECTIVO_USD' ? tasaCambio : null,
          banco: payload.bancoId
            ? { connect: { id: payload.bancoId } }
            : undefined,
          redTarjeta: payload.redTarjetaId
            ? { connect: { id: payload.redTarjetaId } }
            : undefined,
          referencia: payload.referencia || null,
        },
      })

      // 6.6 Actualizar saldo del cliente si es crédito
      if (metodoPago.esCredito && cliente) {
        const saldoActual = Number(cliente.saldoActual)
        const nuevoSaldo = saldoActual + total

        await tx.cliente.update({
          where: { id: cliente.id },
          data: { saldoActual: nuevoSaldo },
        })

        await tx.auditoria.create({
          data: {
            usuario: { connect: { id: user.id } },
            accion: 'cliente.credito_agregado',
            entidadTipo: 'Cliente',
            entidadId: cliente.id,
            datosAntes: { saldoActual } as any,
            datosDespues: {
              saldoNuevo: nuevoSaldo,
              ventaNumero: numeroVentaCompleto,
              monto: total,
            } as any,
          },
        })

        await crearNotificacion({
          titulo: 'Nueva venta al crédito',
          descripcion: `Venta a crédito a ${cliente.nombre} por C$ ${total.toFixed(2)} en ${numeroVentaCompleto}.`,
          tipo: 'info',
          href: '/creditos',
          modulo: 'ventas',
          sucursalId,
          permisoRequerido: 'creditos:gestionar',
        })

      }

      // 6.7 Factura
      const nombreCliente = cliente
        ? cliente.nombreComercial ||
          `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()
        : 'Consumidor Final'

      const factura = await tx.factura.create({
        data: {
          serie,
          numero: numFactura,
          numeroSucursal: numFactura,
          numeroCompleto: numeroFacturaCompleto,
          venta: { connect: { id: venta.id } },
          sucursal: { connect: { id: sucursalId } },
          clienteNombre: nombreCliente,
          clienteRuc: cliente?.numeroDocumento || null,
          clienteDireccion: cliente?.direccion || null,
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

      // 6.8 Auditoría
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
            clienteId: cliente?.id ?? null,
            esCredito: metodoPago.esCredito,
          } as any,
        },
      })

      return { venta, factura }
    })

     // ENVIAR CORREO AUTOMÁTICO AL COBRAR
    if (cliente?.correo) {
      const { enviarFacturaPorEmail } = await import('@/lib/email/send-factura')
      
      enviarFacturaPorEmail(resultado.factura.id, cliente.correo)
        .then((res) => {
          if (!res.success) console.error('Fallo al enviar correo:', res.error)
        })
        .catch((err) => console.error('Error inesperado en email:', err))
    }

    revalidatePath('/pos')
    revalidatePath('/inventario')
    revalidatePath('/caja')
    revalidatePath('/clientes')

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