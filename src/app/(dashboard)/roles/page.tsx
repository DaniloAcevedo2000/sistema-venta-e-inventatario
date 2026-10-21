import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { RolesTable } from './roles-table'

export const metadata = { title: 'Roles y Permisos | Momoto Café' }

export default async function RolesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('roles:gestionar')) redirect('/dashboard')

  // 👇 Consulta profunda para obtener los detalles
  const roles = await prisma.rol.findMany({
    include: {
      usuarios: {
        include: {
          usuario: { select: { id: true, nombre: true, correo: true } }
        }
      },
      permisos: {
        include: {
          permiso: { select: { id: true, nombre: true, codigo: true, grupo: true } }
        }
      },
    },
    orderBy: { nombre: 'asc' },
  })

  const rolesSerializados = roles.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    activo: r.activo,
    usuariosCount: r.usuarios.length,
    permisosCount: r.permisos.length,
    // Mapeamos los detalles para los modales
    usuarios: r.usuarios.map(u => u.usuario),
    permisos: r.permisos.map(p => p.permiso),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Administra los niveles de acceso y permisos de los usuarios.
          </p>
        </div>
        <Button asChild>
          <Link href="/roles/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
          </Link>
        </Button>
      </div>

      <RolesTable data={rolesSerializados} />
    </div>
  )
}