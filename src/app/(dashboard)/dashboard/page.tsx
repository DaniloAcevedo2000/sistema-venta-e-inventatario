import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export const metadata = { title: 'BI Dashboard | Momoto Café' }

type Search = { rango?: string; desde?: string; hasta?: string }

function validDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}
function dayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function labelDate(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('es-NI', { day: '2-digit', month: 'short' })
}
function n(value: unknown) { return Number(value ?? 0) }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  let start = new Date(today)
  let endExclusive = new Date(today); endExclusive.setDate(endExclusive.getDate() + 1)
  const from = validDate(params.desde)
  const to = validDate(params.hasta)
  const range = params.rango || '30d'

  if (from && to && from <= to) {
    start = from
    endExclusive = new Date(to); endExclusive.setDate(endExclusive.getDate() + 1)
  } else if (range === 'hoy') {
    start = new Date(today)
  } else if (range === '7d') {
    start.setDate(start.getDate() - 6)
  } else if (range === 'año') {
    start = new Date(now.getFullYear(), 0, 1)
  } else {
    start.setDate(start.getDate() - 29)
  }

  const sucursalId = session.user.sucursalId
  const branchWhere = sucursalId ? { sucursalId } : {}
  const dateWhere = { gte: start, lt: endExclusive }

  const [ventas, pedidos, stocks, facturas, recetas, movimientos] = await Promise.all([
    prisma.venta.findMany({
      where: { ...branchWhere, estado: 'COMPLETADA', creadoEn: dateWhere },
      include: { items: { include: { producto: { include: { categoria: true } } } }, pagos: true, factura: true },
      orderBy: { creadoEn: 'asc' },
    }),
    prisma.pedido.findMany({
      where: { ...branchWhere, creadoEn: dateWhere },
      orderBy: { creadoEn: 'asc' },
    }),
    prisma.stock.findMany({
      where: branchWhere,
      include: { insumo: true, producto: { include: { categoria: true } } },
    }),
    prisma.factura.findMany({
      where: { ...branchWhere, creadoEn: dateWhere },
      include: { notasCredito: true },
      orderBy: { creadoEn: 'asc' },
    }),
    prisma.receta.findMany({
      where: { activa: true },
      include: { producto: true, items: { include: { insumo: true } } },
    }),
    prisma.movimientoInventario.findMany({
      where: { ...branchWhere, creadoEn: dateWhere },
      orderBy: { creadoEn: 'asc' },
    }),
  ])

  const totalVentas = ventas.reduce((s, v) => s + n(v.total), 0)
  const ticket = totalVentas / (ventas.length || 1)

  const daily: Record<string, { ventas: number; ticketSum: number; tickets: number; descuento: number }> = {}
  const orderDaily: Record<string, number> = {}
  const invoiceDaily: Record<string, { facturado: number; cobrado: number }> = {}

  for (let d = new Date(start); d < endExclusive; d.setDate(d.getDate() + 1)) {
    const key = dayKey(d)
    daily[key] = { ventas: 0, ticketSum: 0, tickets: 0, descuento: 0 }
    orderDaily[key] = 0
    invoiceDaily[key] = { facturado: 0, cobrado: 0 }
  }

  for (const v of ventas) {
    const key = dayKey(v.creadoEn)
    if (!daily[key]) daily[key] = { ventas: 0, ticketSum: 0, tickets: 0, descuento: 0 }
    daily[key].ventas += n(v.total)
    daily[key].ticketSum += n(v.total)
    daily[key].tickets += 1
    daily[key].descuento += n(v.descuento)
  }

  for (const p of pedidos) {
    const key = dayKey(p.creadoEn)
    orderDaily[key] = (orderDaily[key] || 0) + 1
  }

  const ventasTiempo = Object.keys(daily).sort().map(key => ({
    fecha: labelDate(key), 
    ventas: daily[key].ventas,
    ticketPromedio: daily[key].tickets ? daily[key].ticketSum / daily[key].tickets : 0,
  }))

  const descuentos = Object.keys(daily).sort().map(key => ({ fecha: labelDate(key), descuento: daily[key].descuento }))
  const ventasPorHora = Array.from({ length: 24 }, (_, hora) => ({ hora: `${String(hora).padStart(2, '0')}:00`, ventas: 0 }))
  const pedidosPorHora = Array.from({ length: 24 }, (_, hora) => ({ hora: `${String(hora).padStart(2, '0')}:00`, cantidad: 0 }))
  
  for (const v of ventas) ventasPorHora[v.creadoEn.getHours()].ventas += n(v.total)
  for (const p of pedidos) pedidosPorHora[p.creadoEn.getHours()].cantidad += 1

  const pagosMap: Record<string, number> = {}
  for (const v of ventas) for (const p of v.pagos) pagosMap[p.metodoCodigo || 'OTRO'] = (pagosMap[p.metodoCodigo || 'OTRO'] || 0) + n(p.montoNio)
  const pagos = Object.entries(pagosMap).map(([name, value]) => ({ name, value }))

  const categorySales: Record<string, number> = {}
  const productMap: Record<string, { name: string; cantidad: number; ingresos: number; costo: number }> = {}
  
  for (const v of ventas) {
    for (const item of v.items) {
      const cat = item.producto?.categoria?.nombre || 'Sin categoría'
      categorySales[cat] = (categorySales[cat] || 0) + n(item.total)

      const key = `${item.productoId}:${item.varianteId || ''}`
      if (!productMap[key]) productMap[key] = { name: item.nombreVariante ? `${item.nombreProducto} · ${item.nombreVariante}` : item.nombreProducto, cantidad: 0, ingresos: 0, costo: 0 }
      productMap[key].cantidad += n(item.cantidad)
      productMap[key].ingresos += n(item.total)
      
      const recipe = recetas.find(r => r.productoId === item.productoId && (!r.varianteId || r.varianteId === item.varianteId))
      if (recipe) {
        const costPerPortion = recipe.items.reduce((sum, ri) => {
          const waste = 1 + n(ri.mermaPorcentaje) / 100
          return sum + n(ri.insumo.costoUnitario) * n(ri.cantidad) * waste
        }, 0)
        productMap[key].costo += costPerPortion * n(item.cantidad)
      }
    }
  }

  const productos = Object.values(productMap).map(p => ({
    ...p, 
    margen: p.ingresos - p.costo,
    margenPorcentaje: p.ingresos > 0 ? ((p.ingresos - p.costo) / p.ingresos) * 100 : 0,
  })).sort((a, b) => b.ingresos - a.ingresos)

  const inventario = stocks.map(s => ({
    name: s.insumo?.nombre || s.producto?.nombre || 'Artículo',
    actual: n(s.cantidad),
    minimo: n(s.insumo?.stockMinimo),
    categoria: s.producto?.categoria?.nombre || (s.insumo ? 'Insumos' : 'Sin categoría'),
  })).sort((a, b) => a.actual - b.actual)

  const catMap: Record<string, number> = {}
  for (const s of stocks) {
    const cat = s.producto?.categoria?.nombre || (s.insumo ? 'Insumos' : 'Sin categoría')
    catMap[cat] = (catMap[cat] || 0) + n(s.cantidad)
  }
  const inventarioCat = Object.entries(catMap).map(([name, value]) => ({ name, value }))

  const statusMap: Record<string, number> = {}
  for (const p of pedidos) statusMap[p.estado] = (statusMap[p.estado] || 0) + 1
  const pedidosEstado = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const pedidosPorDia = days.map((dia, i) => ({ dia, cantidad: pedidos.filter(p => p.creadoEn.getDay() === i).length }))

  const facturaMap: Record<string, { facturado: number; cobrado: number }> = { ...invoiceDaily }
  for (const f of facturas) {
    const key = dayKey(f.creadoEn)
    if (!facturaMap[key]) facturaMap[key] = { facturado: 0, cobrado: 0 }
    if (f.estado !== 'ANULADA') facturaMap[key].facturado += n(f.total)
  }
  for (const v of ventas) {
    const key = dayKey(v.creadoEn)
    if (!facturaMap[key]) facturaMap[key] = { facturado: 0, cobrado: 0 }
    facturaMap[key].cobrado += v.pagos.reduce((sum, p) => sum + n(p.montoNio), 0)
  }
  const facturacion = Object.keys(facturaMap).sort().map(key => ({ fecha: labelDate(key), ...facturaMap[key] }))

  const facturasEstadosMap: Record<string, number> = {}
  for (const f of facturas) facturasEstadosMap[f.estado] = (facturasEstadosMap[f.estado] || 0) + 1
  const facturasEstado = Object.entries(facturasEstadosMap).map(([name, value]) => ({ name, value }))

  const anuladasMap: Record<string, number> = {}
  for (const f of facturas.filter(f => f.estado === 'ANULADA')) {
    const key = dayKey(f.creadoEn)
    anuladasMap[key] = (anuladasMap[key] || 0) + 1
  }
  const facturasAnuladas = Object.keys(daily).sort().map(key => ({ fecha: labelDate(key), cantidad: anuladasMap[key] || 0 }))

  const movementMap: Record<string, { cantidad: number; merma: number }> = {}
  for (const m of movimientos) {
    if (!movementMap[m.tipo]) movementMap[m.tipo] = { cantidad: 0, merma: 0 }
    movementMap[m.tipo].cantidad += Math.abs(n(m.cantidad))
    if (m.tipo === 'MERMA') movementMap[m.tipo].merma += Math.abs(n(m.cantidad))
  }
  const movimientosGrafico = Object.entries(movementMap).map(([tipo, v]) => ({ tipo, ...v }))

  const recipeData = recetas.map(r => {
    const costo = r.items.reduce((sum, ri) => sum + n(ri.insumo.costoUnitario) * n(ri.cantidad) * (1 + n(ri.mermaPorcentaje) / 100), 0)
    const nombre = r.producto.nombre
    const ventasProducto = productos.filter(p => p.name === nombre || p.name.startsWith(`${r.producto.nombre} ·`))
    const cantidadVendida = ventasProducto.reduce((sum, p) => sum + p.cantidad, 0)
    const margen = ventasProducto.reduce((sum, p) => sum + p.margen, 0)
    const precio = n(r.producto.precioBase)
    return { name: nombre, costo, precio, cantidadVendida, margen, ingredientes: r.items.length }
  }).sort((a, b) => b.costo - a.costo)

  const ingredientMap: Record<string, number> = {}
  for (const r of recetas) for (const item of r.items) {
    const cost = n(item.insumo.costoUnitario) * n(item.cantidad) * (1 + n(item.mermaPorcentaje) / 100)
    ingredientMap[item.insumo.nombre] = (ingredientMap[item.insumo.nombre] || 0) + cost
  }
  const ingredientesCosto = Object.entries(ingredientMap).map(([name, costo]) => ({ name, costo })).sort((a, b) => b.costo - a.costo).slice(0, 12)

  const avgMinutes = (a: Date | null, b: Date | null) => a && b ? Math.max(0, (b.getTime() - a.getTime()) / 60000) : null
  const stageDefs = [
    ['Confirmación', (p:any) => avgMinutes(p.creadoEn, p.confirmadoEn)],
    ['Preparación', (p:any) => avgMinutes(p.confirmadoEn, p.preparacionEn)],
    ['Listo', (p:any) => avgMinutes(p.preparacionEn, p.listoEn)],
    ['Entrega', (p:any) => avgMinutes(p.listoEn, p.entregadoEn)],
  ] as const
  const tiemposPedido = stageDefs.map(([name, fn]) => {
    const vals = pedidos.map(fn).filter((v): v is number => v !== null)
    return { name, minutos: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0 }
  }).filter(x => x.minutos > 0)

  const cancelMap: Record<string, number> = {}
  for (const p of pedidos.filter((p:any) => p.estado === 'CANCELADO')) {
    const reason = p.motivoCancelacion || 'Sin motivo especificado'
    cancelMap[reason] = (cancelMap[reason] || 0) + 1
  }
  const cancelaciones = Object.entries(cancelMap).map(([name, cantidad]) => ({ name, cantidad })).sort((a,b)=>b.cantidad-a.cantidad)
  const pedidosTiempo = Object.keys(orderDaily).sort().map(key => ({ fecha: labelDate(key), cantidad: orderDaily[key] }))

  return <DashboardClient
    rangoActual={range}
    fechas={{ desde: params.desde, hasta: params.hasta }}
    kpis={{ ventas: totalVentas, ticket, pedidos: pedidos.length, alertasStock: inventario.filter(i => i.actual <= i.minimo).length }}
    graficos={{
      ventasTiempo, ventasPorHora, pagos, productos,
      topPorIngreso: productos.slice(0, 10),
      topPorCantidad: [...productos].sort((a,b)=>b.cantidad-a.cantidad).slice(0,10),
      inventario, inventarioCat, pedidosEstado, pedidosPorDia, pedidosTiempo, pedidosPorHora,
      facturacion, facturasEstado, facturasAnuladas, movimientos: movimientosGrafico,
      recetas: recipeData, ingredientesCosto, tiemposPedido, cancelaciones, descuentos,
      ventasCategoria: Object.entries(categorySales).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value),
    }}
  />
}