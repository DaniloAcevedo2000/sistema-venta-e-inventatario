import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { VentasTable } from './ventas-table'

export const metadata = {
  title: 'Ventas | Momoto Café',
}

export default async function VentasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('ventas:leer')) redirect('/dashboard')

  // ============================================
  // CARGAR VENTAS CON TODA LA INFO DE ANULACIÓN
  // ============================================
  const ventas = await prisma.venta.findMany({
    include: {
      sucursal: { select: { nombre: true } },
      usuario: { select: { nombre: true } },
      anuladaPor: { select: { nombre: true } },
      cliente: { select: { nombre: true, apellido: true } },
      factura: {
        select: {
          id: true,
          numeroCompleto: true,
          estado: true,
        },
      },
      notasCredito: {
        select: {
          id: true,
          numero: true,
          total: true,
          motivo: true,
          fechaEmision: true,
        },
      },
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
    take: 500,
  })

  // ============================================
  // CARGAR MOVIMIENTOS DE INVENTARIO GENERADOS POR ANULACIONES
  // ============================================
  const ventasIds = ventas.map((v) => v.id)

  const movimientosAnulacion = await prisma.movimientoInventario.findMany({
    where: {
      referenciaTipo: 'venta_anulada',
      referenciaId: { in: ventasIds },
    },
    include: {
      insumo: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
          unidadMedida: { select: { abreviatura: true } },
        },
      },
      producto: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
    },
    orderBy: { creadoEn: 'desc' },
  })

  // Agrupar movimientos por ventaId
  const movimientosPorVenta = movimientosAnulacion.reduce(
    (acc, mov) => {
      if (!mov.referenciaId) return acc
      if (!acc[mov.referenciaId]) acc[mov.referenciaId] = []
      acc[mov.referenciaId].push({
        id: mov.id,
        tipo: mov.tipo,
        cantidad: Number(mov.cantidad),
        insumoNombre: mov.insumo?.nombre ?? null,
        insumoCodigo: mov.insumo?.codigo ?? null,
        unidadAbreviatura: mov.insumo?.unidadMedida.abreviatura ?? null,
        productoNombre: mov.producto?.nombre ?? null,
        productoCodigo: mov.producto?.codigo ?? null,
      })
      return acc
    },
    {} as Record<
      string,
      Array<{
        id: string
        tipo: string
        cantidad: number
        insumoNombre: string | null
        insumoCodigo: string | null
        unidadAbreviatura: string | null
        productoNombre: string | null
        productoCodigo: string | null
      }>
    >
  )

  // ============================================
  // SERIALIZAR
  // ============================================
  const ventasSerializadas = ventas.map((v) => {
    const fecha = v.creadoEn
    const pago = v.pagos[0]
    const nc = v.notasCredito[0]

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
      cajeroNombre: v.usuario.nombre,
      sucursalNombre: v.sucursal.nombre,
      metodoPago: pago?.metodoPago?.nombre ?? pago?.metodoCodigo ?? '—',
      banco: pago?.banco?.nombreCorto ?? null,
      redTarjeta: pago?.redTarjeta?.nombre ?? null,
      total: Number(v.total),
      estado: v.estado,
      tipo: v.tipo,
      cantidadItems: v._count.items,

      // Anulación
      anuladaEn: v.anuladaEn?.toISOString() ?? null,
      anuladaPorNombre: v.anuladaPor?.nombre ?? null,
      motivoAnulacion: v.motivoAnulacion,
      devueltaAlInventario: v.devueltaAlInventario,
      montoDevuelto: v.montoDevuelto ? Number(v.montoDevuelto) : null,
      metodoDevolucion: v.metodoDevolucion,
      referenciaDevolucion: null, // se puede agregar después si añadimos el campo

      // Nota de crédito
      notaCreditoNumero: nc?.numero ?? null,
      notaCreditoId: nc?.id ?? null,
      notaCreditoTotal: nc ? Number(nc.total) : null,

      // Movimientos de inventario por anulación
      movimientosAnulacion: movimientosPorVenta[v.id] ?? [],
    }
  })

  // ============================================
  // STATS DEL MES
  // ============================================
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

  const [statsHoy, statsMes] = await Promise.all([
    prisma.venta.aggregate({
      where: { creadoEn: { gte: hoy }, estado: 'COMPLETADA' },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venta.aggregate({
      where: { creadoEn: { gte: inicioMes }, estado: 'COMPLETADA' },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const totalHoy = Number(statsHoy._sum.total ?? 0)
  const totalMes = Number(statsMes._sum.total ?? 0)
  const cantidadHoy = statsHoy._count
  const cantidadMes = statsMes._count
  const ticketPromedio = cantidadMes > 0 ? totalMes / cantidadMes : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
        <p className="text-muted-foreground">
          Historial completo de ventas y facturación
        </p>
      </div>

      <VentasTable
        ventas={ventasSerializadas}
        permisos={session.user.permisos}
        stats={{
          totalHoy,
          totalMes,
          cantidadHoy,
          cantidadMes,
          ticketPromedio,
        }}
      />
    </div>
  )
}