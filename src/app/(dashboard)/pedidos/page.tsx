import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PedidosTable } from './pedidos-table'

export const metadata = {
  title: 'Pedidos | Momoto Café',
}

export default async function PedidosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('pedidos:leer')) redirect('/dashboard')

  const pedidos = await prisma.pedido.findMany({
    include: {
      sucursal: { select: { nombre: true } },
      zonaEntrega: { select: { nombre: true } },
      repartidor: { select: { nombre: true } },
      _count: { select: { items: true } },
    },
    orderBy: { creadoEn: 'desc' },
    take: 500,
  })

  const pedidosSerializados = pedidos.map((p) => {
    const fecha = p.creadoEn
    return {
      id: p.id,
      numero: p.numero,
      tipo: p.tipo as 'DELIVERY' | 'PICKUP',
      estado: p.estado,
      clienteNombre: p.clienteNombre,
      clienteTelefono: p.clienteTelefono,
      clienteDireccion: p.clienteDireccion,
      zonaNombre: p.zonaEntrega?.nombre ?? null,
      sucursalNombre: p.sucursal.nombre,
      repartidorNombre: p.repartidor?.nombre ?? null,
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
      total: Number(p.total),
      costoEnvio: Number(p.costoEnvio),
      cantidadItems: p._count.items,
      estadoPago: p.estadoPago,
    }
  })

  // Stats
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const pedidosHoy = pedidos.filter((p) => p.creadoEn >= hoy)
  const activos = pedidos.filter(
    (p) => !['ENTREGADO', 'CANCELADO'].includes(p.estado)
  ).length
  const enCamino = pedidos.filter((p) => p.estado === 'EN_CAMINO').length
  const entregadosHoy = pedidosHoy.filter(
    (p) => p.estado === 'ENTREGADO'
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          Gestión de pedidos para delivery y pickup
        </p>
      </div>

      <PedidosTable
        pedidos={pedidosSerializados}
        permisos={session.user.permisos}
        stats={{
          totalHoy: pedidosHoy.length,
          activos,
          enCamino,
          entregadosHoy,
        }}
      />
    </div>
  )
}