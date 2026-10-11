import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RepartidoresTable } from './repartidores-table'

export const metadata = {
  title: 'Repartidores | Momoto Café',
}

export default async function RepartidoresPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('usuarios:leer')) redirect('/dashboard')

  const [repartidores, sucursales] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        roles: {
          some: { rol: { codigo: 'REPARTIDOR' } },
        },
      },
      include: {
        sucursal: { select: { id: true, nombre: true } },
        _count: {
          select: {
            pedidosRepartidos: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.sucursal.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
  ])

  const repartidoresSerializados = repartidores.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    correo: r.correo,
    telefono: r.telefono,
    activo: r.activo,
    sucursalId: r.sucursalId,
    sucursalNombre: r.sucursal?.nombre ?? null,
    cantidadPedidos: r._count.pedidosRepartidos,
  }))

  // Stats
  const activos = repartidores.filter((r) => r.activo).length
  const totalPedidos = repartidores.reduce(
    (sum, r) => sum + r._count.pedidosRepartidos,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repartidores</h1>
        <p className="text-muted-foreground">
          Gestiona los repartidores del sistema
        </p>
      </div>

      <RepartidoresTable
        repartidores={repartidoresSerializados}
        sucursales={sucursales}
        permisos={session.user.permisos}
        stats={{
          total: repartidores.length,
          activos,
          totalPedidos,
        }}
      />
    </div>
  )
}