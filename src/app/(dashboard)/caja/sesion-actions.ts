'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getSesionDetalle(sesionId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const sesion = await prisma.sesionCaja.findUnique({
    where: { id: sesionId },
    include: {
      caja: { select: { nombre: true, codigo: true } },
      usuarioApertura: { select: { id: true, nombre: true } },
      movimientos: {
        include: {
          usuario: { select: { nombre: true } },
        },
        orderBy: { creadoEn: 'desc' },
      },
      ventas: {
        include: {
          cliente: { select: { nombre: true, apellido: true } },
          factura: {
            select: {
              id: true,
              numeroCompleto: true,
              estado: true,
            },
          },
          notasCredito: {
            select: { id: true, numero: true, total: true },
          },
          anuladaPor: { select: { nombre: true } },
          pagos: {
            include: {
              metodoPago: { select: { nombre: true } },
              banco: { select: { nombreCorto: true } },
              redTarjeta: { select: { nombre: true } },
            },
          },
          _count: { select: { items: true } },
        },
        orderBy: { creadoEn: 'desc' },
      },
    },
  })

  if (!sesion) throw new Error('Sesión no encontrada')

  // ============================================
  // CALCULAR TOTALES EN TIEMPO REAL
  // ============================================
  // Solo contar ventas COMPLETADAS (no anuladas)
  const ventasCompletadas = sesion.ventas.filter(
    (v) => v.estado === 'COMPLETADA'
  )

  // Totales por método de pago
  const totalEfectivo = ventasCompletadas.reduce(
    (sum, v) => sum + Number(v.totalEfectivoNio) + Number(v.totalEfectivoUsd),
    0
  )
  const totalTarjeta = ventasCompletadas.reduce(
    (sum, v) => sum + Number(v.totalTarjeta),
    0
  )
  const totalTransferencia = ventasCompletadas.reduce(
    (sum, v) => sum + Number(v.totalTransferencia),
    0
  )
  const totalCredito = ventasCompletadas.reduce(
    (sum, v) => sum + Number(v.totalCredito),
    0
  )
  const totalVentas = ventasCompletadas.reduce(
    (sum, v) => sum + Number(v.total),
    0
  )

  // Totales de anulaciones
  const ventasAnuladas = sesion.ventas.filter((v) => v.estado === 'ANULADA')
  const totalAnulado = ventasAnuladas.reduce(
    (sum, v) => sum + Number(v.total),
    0
  )

  // Movimientos manuales
  const totalIngresos = sesion.movimientos
    .filter((m) => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0)
  const totalEgresos = sesion.movimientos
    .filter((m) => m.tipo === 'EGRESO' || m.tipo === 'RETIRO')
    .reduce((sum, m) => sum + Number(m.monto), 0)

  // Monto esperado en caja física (para sesión abierta)
  const montoEsperadoTiempoReal =
    Number(sesion.montoInicial) +
    totalEfectivo +
    totalIngresos -
    totalEgresos

  return {
    id: sesion.id,
    cajaNombre: sesion.caja.nombre,
    cajaCodigo: sesion.caja.codigo,
    cajero: sesion.usuarioApertura.nombre,
    cajeroId: sesion.usuarioApertura.id,
    fechaApertura: sesion.fechaApertura.toISOString(),
    fechaCierre: sesion.fechaCierre?.toISOString() ?? null,
    montoInicial: Number(sesion.montoInicial),
    montoFinal: sesion.montoFinal ? Number(sesion.montoFinal) : null,

    // Si está cerrada, usar los valores guardados al cierre
    // Si está abierta, calcular en tiempo real
    montoEsperado:
      sesion.estado === 'CERRADA' && sesion.montoEsperado
        ? Number(sesion.montoEsperado)
        : montoEsperadoTiempoReal,
    diferencia: sesion.diferencia ? Number(sesion.diferencia) : null,

    // Totales calculados en tiempo real
    totalVentas,
    totalEfectivo,
    totalTarjeta,
    totalTransferencia,
    totalCredito,
    totalAnulado,
    totalIngresos,
    totalEgresos,
    cantidadVentasCompletadas: ventasCompletadas.length,
    cantidadVentasAnuladas: ventasAnuladas.length,

    estado: sesion.estado,
    cantidadVentas: sesion.ventas.length,
    movimientos: sesion.movimientos.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      monto: Number(m.monto),
      motivo: m.motivo,
      referencia: m.referencia,
      usuarioNombre: m.usuario.nombre,
      creadoEn: m.creadoEn.toISOString(),
    })),
    ventas: sesion.ventas.map((v) => {
      const pago = v.pagos[0]
      const nc = v.notasCredito[0]
      const fecha = v.creadoEn

      return {
        id: v.id,
        numero: v.numero,
        facturaNumero: v.factura?.numeroCompleto ?? null,
        facturaId: v.factura?.id ?? null,
        fecha: new Intl.DateTimeFormat('es-NI', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(fecha),
        hora: new Intl.DateTimeFormat('es-NI', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(fecha),
        fechaISO: fecha.toISOString(),
        clienteNombre: v.cliente
          ? `${v.cliente.nombre} ${v.cliente.apellido ?? ''}`.trim()
          : 'Consumidor Final',
        cajeroNombre: sesion.usuarioApertura.nombre,
        sucursalNombre: '',
        metodoPago: pago?.metodoPago?.nombre ?? pago?.metodoCodigo ?? '—',
        banco: pago?.banco?.nombreCorto ?? null,
        redTarjeta: pago?.redTarjeta?.nombre ?? null,
        total: Number(v.total),
        estado: v.estado,
        tipo: v.tipo,
        cantidadItems: v._count.items,
        anuladaEn: v.anuladaEn?.toISOString() ?? null,
        anuladaPorNombre: v.anuladaPor?.nombre ?? null,
        motivoAnulacion: v.motivoAnulacion,
        devueltaAlInventario: v.devueltaAlInventario,
        montoDevuelto: v.montoDevuelto ? Number(v.montoDevuelto) : null,
        metodoDevolucion: v.metodoDevolucion,
        referenciaDevolucion: null,
        notaCreditoNumero: nc?.numero ?? null,
        notaCreditoId: nc?.id ?? null,
        notaCreditoTotal: nc ? Number(nc.total) : null,
        movimientosAnulacion: [],
      }
    }),
  }
}