import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProveedoresTable } from './proveedores-table'

export const metadata = { title: 'Proveedores | Momoto Café' }

export default async function ProveedoresPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('compras:leer')) redirect('/dashboard')

  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { ordenes: true } } }
  })

  const serializados = proveedores.map(p => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    nombreComercial: p.nombreComercial,
    ruc: p.ruc,
    telefono: p.telefono,
    correo: p.correo,
    direccion: p.direccion,
    activo: p.activo,
    ordenesCount: p._count.ordenes
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
        <p className="text-muted-foreground">Gestiona tu catálogo de proveedores</p>
      </div>
      {/* AQUI SE PASAN LOS PERMISOS */}
      <ProveedoresTable proveedores={serializados} permisos={session.user.permisos} />
    </div>
  )
}