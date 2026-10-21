import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SucursalesTable } from './sucursales-table'

export const metadata = { title: 'Sucursales | Momoto Café' }

export default async function SucursalesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('sucursales:gestionar')) redirect('/dashboard')

  const sucursales = await prisma.sucursal.findMany({
    include: {
      _count: { select: { cajas: true, ventas: true, usuarios: true } }
    },
    orderBy: { nombre: 'asc' }
  })

  const serializadas = sucursales.map(s => ({
    id: s.id,
    codigo: s.codigo,
    nombre: s.nombre,
    direccion: s.direccion,
    telefono: s.telefono,
    correo: s.correo,
    activa: s.activa,
    cajasCount: s._count.cajas,
    ventasCount: s._count.ventas,
    usuariosCount: s._count.usuarios,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-muted-foreground">
            Administra los locales físicos de tu negocio.
          </p>
        </div>
        <Button asChild>
          <Link href="/sucursales/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
          </Link>
        </Button>
      </div>

      <SucursalesTable sucursales={serializadas} />
    </div>
  )
}