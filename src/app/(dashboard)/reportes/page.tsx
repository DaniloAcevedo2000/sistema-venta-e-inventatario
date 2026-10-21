import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ReportesClient } from './reportes-client'

export const metadata = { title: 'Reportes | Momoto Café' }

export default async function ReportesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('reportes:ver')) redirect('/dashboard')

  const sucursalId = session.user.sucursalId
  const hace6Meses = new Date()
  hace6Meses.setMonth(hace6Meses.getMonth() - 6)

  const [ventas, stocks, pedidos, facturas, sucursales, usuarios] = await Promise.all([
    prisma.venta.findMany({
      where: { sucursalId: sucursalId || undefined, creadoEn: { gte: hace6Meses } },
      include: { cliente: true, usuario: true, pagos: { include: { metodoPago: true } }, sucursal: true, items: true },
      orderBy: { creadoEn: 'desc' }
    }),
    prisma.stock.findMany({
      where: { sucursalId: sucursalId || undefined },
      include: { 
        insumo: true, 
        // 👇 SOLUCIÓN: Incluimos la categoría dentro del producto
        producto: { include: { categoria: true } } 
      }
    }),
    prisma.pedido.findMany({
      where: { sucursalId: sucursalId || undefined, creadoEn: { gte: hace6Meses } }
    }),
    prisma.factura.findMany({
      where: { sucursalId: sucursalId || undefined, creadoEn: { gte: hace6Meses } }
    }),
    prisma.sucursal.findMany({ where: { activa: true } }),
    prisma.usuario.findMany({ where: { activo: true } })
  ])

  // Serialización
  const ventasSerializadas = ventas.map(v => ({
    id: v.id,
    numero: v.numero,
    fecha: v.creadoEn.toISOString(),
    cliente: v.cliente?.nombre || 'Consumidor Final',
    cajero: v.usuario.nombre,
    sucursal: v.sucursal.nombre,
    tipo: v.tipo,
    metodoPago: v.pagos[0]?.metodoPago?.nombre || v.pagos[0]?.metodoCodigo || 'N/A',
    total: Number(v.total),
    estado: v.estado
  }))

  const inventarioData = stocks.map(s => ({
    name: s.insumo?.nombre || s.producto?.nombre || 'Item',
    actual: Number(s.cantidad),
    minimo: Number(s.insumo?.stockMinimo || 0),
    // 👇 Ahora TypeScript encontrará la propiedad 'categoria'
    categoria: s.producto?.categoria?.nombre || (s.insumo ? 'Insumos' : 'Sin categoría')
  })).sort((a,b) => a.actual - b.actual).slice(0, 15)

  const pedidosData = pedidos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 bg-slate-50/50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Centro de Reportes</h1>
        <p className="text-slate-500">Analiza, visualiza y exporta la información de tu negocio.</p>
      </div>

      <ReportesClient 
        ventas={ventasSerializadas} 
        sucursales={sucursales} 
        inventario={inventarioData}
        pedidosPorEstado={Object.keys(pedidosData).map(k => ({ name: k, value: pedidosData[k] }))}
        totalFacturas={facturas.length}
        totalUsuarios={usuarios.length}
      />
    </div>
  )
}