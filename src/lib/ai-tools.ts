import { prisma } from '@/lib/prisma'

// 1. HERRAMIENTA MAESTRA: Consulta dinámica a cualquier tabla
export async function consultarBaseDeDatos(params: {
  modelo: 'ventas' | 'productos' | 'insumos' | 'clientes' | 'proveedores' | 'ordenes_compra' | 'pedidos' | 'cajas' | 'notas_credito',
  fechaInicio?: string,
  fechaFin?: string,
  sucursalId?: string,
  limite?: number
}) {
  const { modelo, fechaInicio, fechaFin, sucursalId, limite = 20 } = params

  const inicio = fechaInicio ? new Date(fechaInicio) : undefined
  const fin = fechaFin ? new Date(fechaFin) : undefined
  if (fin) fin.setHours(23, 59, 59, 999)

  const filtroFecha = inicio || fin ? { creadoEn: { ...(inicio && { gte: inicio }), ...(fin && { lte: fin }) } } : {}
  const filtroSucursal = sucursalId ? { sucursalId } : {}

  // Mapeo de modelos y qué traer (evitando contraseñas)
  switch (modelo) {
    case 'ventas':
      return await prisma.venta.findMany({
        where: { ...filtroFecha, ...filtroSucursal, estado: 'COMPLETADA' },
        select: { numero: true, total: true, tipo: true, creadoEn: true, cliente: { select: { nombre: true } }, usuario: { select: { nombre: true } } },
        take: limite, orderBy: { creadoEn: 'desc' }
      })
    
    case 'productos':
      return await prisma.producto.findMany({
        where: { activo: true },
        select: { nombre: true, precioBase: true, categoria: { select: { nombre: true } } },
        take: limite
      })

    case 'insumos':
      return await prisma.insumo.findMany({
        where: { activo: true },
        select: { nombre: true, costoUnitario: true, stockMinimo: true, stocks: { select: { cantidad: true, sucursal: { select: { nombre: true } } } } },
        take: limite
      })

    case 'clientes':
      return await prisma.cliente.findMany({
        where: { activo: true },
        select: { nombre: true, telefono: true, saldoActual: true, permiteCredito: true },
        take: limite
      })

    case 'proveedores':
      return await prisma.proveedor.findMany({
        where: { activo: true },
        select: { nombre: true, telefono: true, correo: true, ordenes: { select: { numero: true, estado: true } } },
        take: limite
      })

    case 'ordenes_compra':
      return await prisma.ordenCompra.findMany({
        where: { ...filtroFecha, ...filtroSucursal },
        select: { numero: true, estado: true, total: true, proveedor: { select: { nombre: true } }, creadoEn: true },
        take: limite, orderBy: { creadoEn: 'desc' }
      })

    case 'pedidos':
      return await prisma.pedido.findMany({
        where: { ...filtroFecha, ...filtroSucursal },
        select: { numero: true, estado: true, total: true, tipo: true, clienteNombre: true, creadoEn: true },
        take: limite, orderBy: { creadoEn: 'desc' }
      })

    case 'cajas':
      return await prisma.sesionCaja.findMany({
        where: { ...filtroFecha, ...filtroSucursal },
        select: { estado: true, diferencia: true, fechaApertura: true, fechaCierre: true, caja: { select: { nombre: true } }, usuarioApertura: { select: { nombre: true } } },
        take: limite, orderBy: { fechaApertura: 'desc' }
      })

    case 'notas_credito':
      return await prisma.notaCredito.findMany({
        where: { ...filtroFecha, ...filtroSucursal },
        select: { numero: true, total: true, motivo: true, creadoEn: true, venta: { select: { numero: true } } },
        take: limite, orderBy: { creadoEn: 'desc' }
      })

    default:
      return { error: 'Modelo no soportado' }
  }
}

// 2. HERRAMIENTA: Resumen de ventas (la que ya teníamos)
export async function getResumenVentas(fechaInicio: string, fechaFin: string, sucursalId?: string) {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  fin.setHours(23, 59, 59, 999)

  const agregacion = await prisma.venta.aggregate({
    where: { creadoEn: { gte: inicio, lte: fin }, estado: 'COMPLETADA', ...(sucursalId && { sucursalId }) },
    _sum: { total: true, totalEfectivoNio: true, totalTarjeta: true, totalTransferencia: true },
    _count: { id: true },
  })

  const totalVendido = Number(agregacion._sum.total || 0)
  const cantidadTransacciones = agregacion._count.id || 0

  // Datos para la gráfica
  const ventas = await prisma.venta.findMany({
    where: { creadoEn: { gte: inicio, lte: fin }, estado: 'COMPLETADA', ...(sucursalId && { sucursalId }) },
    select: { total: true, creadoEn: true }
  })

  const datosPorDia: Record<string, number> = {}
  ventas.forEach(v => {
    const dia = v.creadoEn.toISOString().split('T')[0]
    datosPorDia[dia] = (datosPorDia[dia] || 0) + Number(v.total)
  })

  const graficaVentas = Object.keys(datosPorDia).map(fecha => ({
    fecha: new Date(fecha).toLocaleDateString('es-NI', { weekday: 'short', day: 'numeric' }),
    total: datosPorDia[fecha]
  })).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  return {
    periodo: `${fechaInicio} al ${fechaFin}`,
    resumen: {
      totalVendido: `C$ ${totalVendido.toFixed(2)}`,
      cantidadTransacciones,
      ticketPromedio: cantidadTransacciones > 0 ? `C$ ${(totalVendido / cantidadTransacciones).toFixed(2)}` : 'C$ 0.00',
    },
    graficaVentas
  }
}

// 3. HERRAMIENTA: Top Productos
export async function getTopProductos(fechaInicio: string, fechaFin: string, limite: number = 5) {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  fin.setHours(23, 59, 59, 999)

  const topItems = await prisma.itemVenta.groupBy({
    by: ['nombreProducto'],
    where: { venta: { creadoEn: { gte: inicio, lte: fin }, estado: 'COMPLETADA' } },
    _sum: { cantidad: true, total: true },
    orderBy: { _sum: { cantidad: 'desc' } },
    take: limite,
  })

  return topItems.map(item => ({
    producto: item.nombreProducto,
    cantidadVendida: Number(item._sum.cantidad || 0),
    ingresosGenerados: `C$ ${Number(item._sum.total || 0).toFixed(2)}`
  }))
}

// 4. HERRAMIENTA: Inventario Crítico
export async function getInventarioCritico(sucursalId?: string) {
  const stocks = await prisma.stock.findMany({
    where: { ...(sucursalId && { sucursalId }), cantidad: { lte: 10 } },
    include: { insumo: { select: { nombre: true, stockMinimo: true } }, producto: { select: { nombre: true } } },
    take: 10
  })

  const criticos = stocks.filter(s => {
    const stockMinimo = s.insumo ? Number(s.insumo.stockMinimo) : 5
    return Number(s.cantidad) <= stockMinimo
  })

  return criticos.map(s => ({
    item: s.insumo?.nombre || s.producto?.nombre || 'Desconocido',
    tipo: s.insumo ? 'Insumo' : 'Producto',
    stockActual: Number(s.cantidad),
    stockMinimo: s.insumo ? Number(s.insumo.stockMinimo) : 5
  }))
}