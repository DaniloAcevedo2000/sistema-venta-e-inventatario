import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ComprasTable } from './compras-table'

export const metadata = { title: 'Compras | Momoto Café' }

export default async function ComprasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('compras:leer')) redirect('/dashboard')

  const ordenes = await prisma.ordenCompra.findMany({
    include: {
      proveedor: { select: { nombre: true } },
      sucursal: { select: { nombre: true } },
      _count: { select: { items: true } }
    },
    orderBy: { creadoEn: 'desc' },
    take: 100
  })

  const serializadas = ordenes.map(o => ({
    id: o.id,
    codigo: o.codigo,
    proveedor: o.proveedor.nombre,
    sucursal: o.sucursal.nombre,
    estado: o.estado,
    fecha: new Intl.DateTimeFormat('es-NI', { day: '2-digit', month: 'short', year: 'numeric' }).format(o.creadoEn),
    total: Number(o.total),
    itemsCount: o._count.items
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h1>
        <p className="text-muted-foreground">Gestiona el abastecimiento y la recepción de mercadería</p>
      </div>
      <ComprasTable ordenes={serializadas} permisos={session.user.permisos} />
    </div>
  )
}