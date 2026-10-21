'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requirePermiso } from '@/lib/helpers/permisos-server'
import {
  siguienteCorrelativo,
  formatVenta,
  formatFactura,
  formatPedido,
} from '@/lib/helpers/correlativos'
import {
  descontarStockDeItems,
  devolverStockDeItems,
} from '@/lib/helpers/inventario'
import {
  getTasaCambioActiva,
  getSerieFactura,
  getSesionCajaAbierta,
  getCodigoSucursal, // 👈 Importamos el nuevo helper
} from '@/lib/helpers/negocio'
import { pedidoSchema } from './schema'

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  pedidoId?: string
}

// ============================================
// CREAR PEDIDO
// ============================================
export async function crearPedidoAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  let pedidoId: string | null = null

  try {
    const user = await requirePermiso('pedidos:crear')

    if (!user.sucursalId) {
      return { error: 'Usuario sin sucursal asignada' }
    }

    const payloadRaw = formData.get('payload') as string
    if (!payloadRaw) return { error: 'No se recibieron datos' }

    const payload = JSON.parse(payloadRaw)
    const parsed = pedidoSchema.safeParse(payload)

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors }
    }

    const data = parsed.data

    // Validaciones específicas
    if (data.tipo === 'DELIVERY') {
      if (!data.clienteDireccion?.trim()) {
        return {
          fieldErrors: { clienteDireccion: ['Requerido para delivery'] },
        }
      }
      if (!data.zonaEntregaId) {
        return { fieldErrors: { zonaEntregaId: ['Selecciona una zona'] } }
      }
    }

    // Cargar zona de entrega si aplica
    let costoEnvio = 0
    if (data.tipo === 'DELIVERY' && data.zonaEntregaId) {
      const zona = await prisma.zonaEntrega.findUnique({
        where: { id: data.zonaEntregaId },
      })
      if (!zona || !zona.activa) {
        return { error: 'Zona de entrega no válida' }
      }
      costoEnvio = Number(zona.tarifa)
    }

    // Calcular totales
    let subtotal = 0
    let descuentoTotal = 0
    let ivaTotal = 0

    const itemsCalculados = data.items.map((item) => {
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

    const total = subtotal - descuentoTotal + costoEnvio

    // 👇 Obtenemos el código de la sucursal
    const sucursalCodigo = await getCodigoSucursal(user.sucursalId)

    // Correlativo atómico por sucursal
    const numeroPedidoSucursal = await siguienteCorrelativo(
      'PEDIDO',
      user.sucursalId
    )
    // 👇 Usamos el código en el formato
    const numeroPedidoCompleto = formatPedido(numeroPedidoSucursal, sucursalCodigo)

    // Crear pedido
    const pedido = await prisma.pedido.create({
      data: {
        numero: numeroPedidoCompleto,
        numeroSucursal: numeroPedidoSucursal,
        tipo: data.tipo,
        estado: 'PENDIENTE',
        sucursal: { connect: { id: user.sucursalId } },
        cliente: data.clienteId
          ? { connect: { id: data.clienteId } }
          : undefined,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        clienteDireccion: data.clienteDireccion || null,
        zonaEntrega: data.zonaEntregaId
          ? { connect: { id: data.zonaEntregaId } }
          : undefined,
        usuarioCreacion: { connect: { id: user.id } },
        fechaProgramada: data.fechaProgramada
          ? new Date(data.fechaProgramada)
          : null,
        subtotal,
        descuento: descuentoTotal,
        impuesto: ivaTotal,
        costoEnvio,
        total,
        estadoPago: 'PENDIENTE',
        notas: data.notas || null,
        notasInternas: data.notasInternas || null,
        latitud: data.latitud ?? null,
        longitud: data.longitud ?? null,

        items: {
          create: itemsCalculados.map((item) => ({
            producto: { connect: { id: item.productoId } },
            variante: item.varianteId
              ? { connect: { id: item.varianteId } }
              : undefined,
            nombreProducto: item.nombreProducto,
            nombreVariante: item.nombreVariante || null,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuentoMonto,
            subtotal: item.subtotal,
            impuesto: item.impuesto,
            total: item.total,
            tipoImpuesto: item.tipoImpuesto,
            notas: item.notas || null,
          })),
        },
      },
    })

    pedidoId = pedido.id

    await prisma.auditoria.create({
      data: {
        usuario: { connect: { id: user.id } },
        accion: 'pedido.crear',
        entidadTipo: 'Pedido',
        entidadId: pedido.id,
        datosDespues: {
          numero: numeroPedidoCompleto,
          tipo: data.tipo,
          total,
        } as any,
      },
    })

    revalidatePath('/pedidos')
  } catch (error) {
    console.error(error)
    return {
      error:
        error instanceof Error ? error.message : 'Error al crear pedido',
    }
  }

  redirect(`/pedidos?pedidoId=${pedidoId}`)
}

// ============================================
// CAMBIAR ESTADO DEL PEDIDO
// ============================================
/**
 * Transiciones y efectos sobre stock:
 * - PENDIENTE → CONFIRMADO: descuenta stock (una sola vez)
 * - CONFIRMADO/EN_PREPARACION/LISTO/EN_CAMINO → CANCELADO: devuelve stock
 * - PENDIENTE → CANCELADO: no toca stock (nunca se descontó)
 * - LISTO → ENTREGADO / EN_CAMINO → ENTREGADO: no toca stock
 */
export async function cambiarEstadoPedidoAction(
  pedidoId: string,
  nuevoEstado: string,
  motivo?: string
) {
  try {
    const user = await requirePermiso('pedidos:editar')

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { items: true },
    })
    if (!pedido) return { error: 'Pedido no encontrado' }
    if (!user.sucursalId) return { error: 'Usuario sin sucursal' }

    // Validar transición
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
      CONFIRMADO: ['EN_PREPARACION', 'CANCELADO'],
      EN_PREPARACION: ['LISTO', 'CANCELADO'],
      LISTO: ['EN_CAMINO', 'ENTREGADO', 'CANCELADO'],
      EN_CAMINO: ['ENTREGADO'],
      ENTREGADO: [],
      CANCELADO: [],
    }

    const estadosPermitidos = transicionesValidas[pedido.estado] ?? []
    if (!estadosPermitidos.includes(nuevoEstado)) {
      return {
        error: `No se puede pasar de ${pedido.estado} a ${nuevoEstado}`,
      }
    }

    // Datos según el nuevo estado
    const now = new Date()
    const updateData: any = { estado: nuevoEstado }

    switch (nuevoEstado) {
      case 'CONFIRMADO':
        updateData.confirmadoEn = now
        break
      case 'EN_PREPARACION':
        updateData.preparacionEn = now
        break
      case 'LISTO':
        updateData.listoEn = now
        break
      case 'EN_CAMINO':
        updateData.enCaminoEn = now
        break
      case 'ENTREGADO':
        updateData.entregadoEn = now
        break
      case 'CANCELADO':
        if (!motivo || motivo.trim().length < 3) {
          return { error: 'El motivo de cancelación es requerido' }
        }
        updateData.canceladoEn = now
        updateData.motivoCancelacion = motivo
        break
    }

    // Reglas de stock
    const debeDescontar =
      pedido.estado === 'PENDIENTE' && nuevoEstado === 'CONFIRMADO'

    const debeDevolver =
      nuevoEstado === 'CANCELADO' &&
      ['CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO'].includes(
        pedido.estado
      )

    const itemsStock = pedido.items.map((i) => ({
      productoId: i.productoId,
      varianteId: i.varianteId,
      cantidad: Number(i.cantidad),
      nombreProducto: i.nombreProducto,
    }))

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar pedido
      await tx.pedido.update({
        where: { id: pedidoId },
        data: updateData,
      })

      // 2. Descontar stock al confirmar
      if (debeDescontar) {
        await descontarStockDeItems({
          tx,
          items: itemsStock,
          sucursalId: user.sucursalId!,
          usuarioId: user.id,
          referenciaTipo: 'pedido',
          referenciaId: pedidoId,
          motivo: `Pedido ${pedido.numero} confirmado`,
        })
      }

      // 3. Devolver stock al cancelar (si ya estaba confirmado)
      if (debeDevolver) {
        await devolverStockDeItems({
          tx,
          items: itemsStock,
          sucursalId: user.sucursalId!,
          usuarioId: user.id,
          referenciaTipo: 'pedido_cancelado',
          referenciaId: pedidoId,
          motivo: `Cancelación pedido ${pedido.numero}: ${motivo}`,
        })
      }

      // 4. Auditoría
      await tx.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: `pedido.${nuevoEstado.toLowerCase()}`,
          entidadTipo: 'Pedido',
          entidadId: pedidoId,
          datosAntes: { estado: pedido.estado } as any,
          datosDespues: {
            estado: nuevoEstado,
            motivo,
            afectoStock: debeDescontar || debeDevolver,
            tipoAfectacion: debeDescontar
              ? 'descuento'
              : debeDevolver
                ? 'devolucion'
                : null,
          } as any,
        },
      })
    })

    revalidatePath('/pedidos')
    revalidatePath('/inventario')
    return { success: true }
  } catch (error) {
    console.error(error)
    return {
      error:
        error instanceof Error ? error.message : 'Error al cambiar estado',
    }
  }
}

// ============================================
// ASIGNAR REPARTIDOR
// ============================================
export async function asignarRepartidorAction(
  pedidoId: string,
  repartidorId: string
) {
  try {
    const user = await requirePermiso('pedidos:asignar_repartidor')

    const repartidor = await prisma.usuario.findUnique({
      where: { id: repartidorId },
      include: { roles: { include: { rol: true } } },
    })

    if (!repartidor) return { error: 'Repartidor no encontrado' }

    const tieneRol = repartidor.roles.some(
      (r) => r.rol.codigo === 'REPARTIDOR'
    )
    if (!tieneRol) return { error: 'El usuario no es repartidor' }

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          repartidorId,
          estado: 'EN_CAMINO',
          enCaminoEn: new Date(),
        },
      }),
      prisma.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'pedido.asignar_repartidor',
          entidadTipo: 'Pedido',
          entidadId: pedidoId,
          datosDespues: { repartidorId } as any,
        },
      }),
    ])

    revalidatePath('/pedidos')
    revalidatePath('/mis-entregas')
    return { success: true }
  } catch (error) {
    console.error(error)
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Error al asignar repartidor',
    }
  }
}

// ============================================
// COBRAR PEDIDO (Convertir a Venta + Factura)
// ============================================
/**
 * IMPORTANTE: al cobrar NO se descuenta stock, porque ya se descontó
 * cuando el pedido pasó a CONFIRMADO. Solo se crea la Venta + Factura
 * + Pago + movimiento de caja + actualización de cliente (si crédito).
 */
export async function cobrarPedidoAction(
  pedidoId: string,
  metodoPagoId: string,
  opciones?: {
    bancoId?: string
    redTarjetaId?: string
    referencia?: string
    montoRecibido?: number
    cambio?: number
  }
) {
  try {
    const user = await requirePermiso('pedidos:cobrar')

    if (!user.sucursalId) {
      return { error: 'Usuario sin sucursal asignada' }
    }

    // ============================================
    // 1. VALIDAR PEDIDO
    // ============================================
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { items: true, cliente: true },
    })

    if (!pedido) return { error: 'Pedido no encontrado' }
    if (pedido.facturadoEn) return { error: 'Este pedido ya fue facturado' }
    if (pedido.estado === 'CANCELADO') {
      return { error: 'No se puede cobrar un pedido cancelado' }
    }
    if (!['LISTO', 'ENTREGADO'].includes(pedido.estado)) {
      return { error: 'El pedido debe estar LISTO o ENTREGADO para cobrarse' }
    }

    // ============================================
    // 2. VALIDAR MÉTODO DE PAGO
    // ============================================
    const metodoPago = await prisma.metodoPago.findUnique({
      where: { id: metodoPagoId },
      include: { moneda: true },
    })

    if (!metodoPago || !metodoPago.activo) {
      return { error: 'Método de pago no válido' }
    }
    if (metodoPago.requiereBanco && !opciones?.bancoId) {
      return { error: 'Debes seleccionar un banco' }
    }
    if (metodoPago.requiereRed && !opciones?.redTarjetaId) {
      return { error: 'Debes seleccionar la red de tarjeta' }
    }

    // ============================================
    // 3. VALIDAR SESIÓN DE CAJA
    // ============================================
    const sesionCaja = await getSesionCajaAbierta(user.id)
    if (!sesionCaja) {
      return {
        error:
          'No tienes una caja abierta. Abre una caja antes de cobrar el pedido.',
      }
    }

    // ============================================
    // 4. VALIDAR CLIENTE PARA CRÉDITO
    // ============================================
    let cliente: any = pedido.cliente
    if (metodoPago.esCredito) {
      if (!cliente) {
        return {
          error:
            'El pedido no tiene cliente asociado. No se puede cobrar a crédito.',
        }
      }
      if (!cliente.permiteCredito) {
        return { error: 'El cliente no tiene crédito habilitado' }
      }

      const saldoActual = Number(cliente.saldoActual)
      const limite = Number(cliente.limiteCredito)
      const disponible = limite - saldoActual
      const total = Number(pedido.total)

      if (disponible < total) {
        return {
          error: `Crédito insuficiente. Disponible: C$ ${disponible.toFixed(2)}, Total: C$ ${total.toFixed(2)}`,
        }
      }
    }

    // ============================================
    // 5. TASA DE CAMBIO, SERIE Y CÓDIGO SUCURSAL
    // ============================================
    const tasaCambio = await getTasaCambioActiva()
    const serie = await getSerieFactura()
    const sucursalCodigo = await getCodigoSucursal(user.sucursalId) // 👈 Obtenemos el código

    // ============================================
    // 6. TRANSACCIÓN
    // ============================================
    const resultado = await prisma.$transaction(async (tx) => {
      // 6.1 Correlativos atómicos
      const numVenta = await siguienteCorrelativo('VENTA', user.sucursalId!, tx)
      const numFactura = await siguienteCorrelativo(
        'FACTURA',
        user.sucursalId!,
        tx
      )

      // 👈 Usamos el código en el formato
      const numeroVentaCompleto = formatVenta(numVenta, sucursalCodigo)
      const numeroFacturaCompleto = formatFactura(serie, numFactura, sucursalCodigo)

      // 6.2 Crear Venta
      const venta = await tx.venta.create({
        data: {
          numero: numeroVentaCompleto,
          numeroSucursal: numVenta,
          tipo: metodoPago.esCredito ? 'CREDITO' : 'CONTADO',
          estado: 'COMPLETADA',
          subtotal: pedido.subtotal,
          descuento: pedido.descuento,
          impuesto: pedido.impuesto,
          total: pedido.total,
          tasaCambio,
          totalEfectivoNio:
            metodoPago.codigo === 'EFECTIVO_NIO' ? pedido.total : 0,
          totalEfectivoUsd:
            metodoPago.codigo === 'EFECTIVO_USD'
              ? opciones?.montoRecibido ?? 0
              : 0,
          totalTarjeta: metodoPago.codigo === 'TARJETA' ? pedido.total : 0,
          totalTransferencia:
            metodoPago.codigo === 'TRANSFERENCIA' ? pedido.total : 0,
          totalCredito: metodoPago.esCredito ? pedido.total : 0,
          sucursal: { connect: { id: user.sucursalId! } },
          usuario: { connect: { id: user.id } },
          sesionCaja: { connect: { id: sesionCaja.id } },
          cliente: cliente ? { connect: { id: cliente.id } } : undefined,
          notas: `Pedido ${pedido.numero}`,
        },
      })

      // 6.3 Crear Items de Venta (SIN tocar stock)
      for (const item of pedido.items) {
        await tx.itemVenta.create({
          data: {
            venta: { connect: { id: venta.id } },
            producto: { connect: { id: item.productoId } },
            variante: item.varianteId
              ? { connect: { id: item.varianteId } }
              : undefined,
            nombreProducto: item.nombreProducto,
            nombreVariante: item.nombreVariante,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuento,
            subtotal: item.subtotal,
            impuesto: item.impuesto,
            total: item.total,
            tipoImpuesto: item.tipoImpuesto,
            notas: item.notas,
          },
        })
      }

      // 6.4 Crear Pago (con tasa si es USD)
      await tx.pagoVenta.create({
        data: {
          venta: { connect: { id: venta.id } },
          metodoPago: { connect: { id: metodoPago.id } },
          metodoCodigo: metodoPago.codigo,
          monto: opciones?.montoRecibido || pedido.total,
          montoNio:
            metodoPago.codigo === 'EFECTIVO_USD'
              ? (opciones?.montoRecibido ?? 0) * tasaCambio
              : pedido.total,
          tasaCambio:
            metodoPago.codigo === 'EFECTIVO_USD' ? tasaCambio : null,
          banco: opciones?.bancoId
            ? { connect: { id: opciones.bancoId } }
            : undefined,
          redTarjeta: opciones?.redTarjetaId
            ? { connect: { id: opciones.redTarjetaId } }
            : undefined,
          referencia: opciones?.referencia || null,
        },
      })

      // 6.5 Actualizar saldo del cliente (si es crédito)
      if (metodoPago.esCredito && cliente) {
        const saldoActual = Number(cliente.saldoActual)
        const nuevoSaldo = saldoActual + Number(pedido.total)

        await tx.cliente.update({
          where: { id: cliente.id },
          data: { saldoActual: nuevoSaldo },
        })

        await tx.pagoCredito.create({
          data: {
            cliente: { connect: { id: cliente.id } },
            monto: pedido.total,
            metodo: 'CREDITO',
            notas: `Venta ${numeroVentaCompleto} (Pedido ${pedido.numero})`,
            saldoAnterior: saldoActual,
            saldoNuevo: nuevoSaldo,
          },
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
              pedidoNumero: pedido.numero,
            } as any,
          },
        })
      }

      // 6.6 Crear Factura
      const nombreCliente = cliente
        ? cliente.nombreComercial ||
          `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()
        : pedido.clienteNombre

      const factura = await tx.factura.create({
        data: {
          serie,
          numero: numFactura,
          numeroSucursal: numFactura,
          numeroCompleto: numeroFacturaCompleto,
          venta: { connect: { id: venta.id } },
          sucursal: { connect: { id: user.sucursalId! } },
          clienteNombre: nombreCliente,
          clienteRuc: cliente?.numeroDocumento || null,
          clienteDireccion:
            cliente?.direccion || pedido.clienteDireccion || null,
          tipoDocumento: 'FACTURA',
          subtotal: pedido.subtotal,
          subtotalGravado:
            Number(pedido.subtotal) - Number(pedido.descuento),
          subtotalExento: 0,
          descuento: pedido.descuento,
          iva: pedido.impuesto,
          total: pedido.total,
          estado: 'EMITIDA',
        },
      })

      // 6.7 Actualizar Pedido (marcar como facturado)
      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          ventaId: venta.id,
          facturadoEn: new Date(),
          usuarioFacturacionId: user.id,
          estadoPago: 'PAGADO',
          metodoPagoId: metodoPago.id,
        },
      })

      // 6.8 Auditoría
      await tx.auditoria.create({
        data: {
          usuario: { connect: { id: user.id } },
          accion: 'pedido.cobrar',
          entidadTipo: 'Pedido',
          entidadId: pedidoId,
          datosDespues: {
            pedidoNumero: pedido.numero,
            ventaNumero: numeroVentaCompleto,
            facturaNumero: numeroFacturaCompleto,
            metodoPago: metodoPago.codigo,
            total: Number(pedido.total),
          } as any,
        },
      })

      return { venta, factura }
    })


    // 7. Enviar factura por correo si el cliente tiene email
    if (cliente?.correo) {
      const { enviarFacturaPorEmail } = await import('@/lib/email/send-factura')
      
      // Lo disparamos sin "await" para no bloquear la respuesta al cajero
      enviarFacturaPorEmail(resultado.factura.id, cliente.correo)
        .then((res) => {
          if (!res.success) console.error('Fallo al enviar correo:', res.error)
        })
        .catch((err) => console.error('Error inesperado en email:', err))
    }

    revalidatePath('/pedidos')
    revalidatePath('/ventas')
    revalidatePath('/facturas')
    revalidatePath('/caja')
    revalidatePath('/inventario')

    return {
      success: true,
      ventaId: resultado.venta.id,
      ventaNumero: resultado.venta.numero,
      facturaId: resultado.factura.id,
      facturaNumero: resultado.factura.numeroCompleto,
    }
  } catch (error) {
    console.error('Error cobrando pedido:', error)
    return {
      error:
        error instanceof Error ? error.message : 'Error al cobrar el pedido',
    }
  }
}