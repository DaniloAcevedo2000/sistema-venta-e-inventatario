import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { UsuariosTable } from './usuarios-table'

export const metadata = { title: 'Usuarios | Momoto Café' }

export default async function UsuariosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('usuarios:leer')) redirect('/dashboard')

  // 1. Obtener usuarios
  const usuarios = await prisma.usuario.findMany({
    include: {
      sucursal: { select: { nombre: true } },
      roles: { include: { rol: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  // 2. Obtener roles y sucursales para los filtros
  const roles = await prisma.rol.findMany({ orderBy: { nombre: 'asc' } })
  const sucursales = await prisma.sucursal.findMany({ where: { activa: true } })

  const serializados = usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    telefono: u.telefono,
    sucursalNombre: u.sucursal?.nombre || 'Todas',
    rolesNombres: u.roles.map((r) => r.rol.nombre).join(', '),
    activo: u.activo,
    creadoEn: u.creadoEn.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona el personal y sus accesos al sistema.
          </p>
        </div>
        {session.user.permisos.includes('usuarios:crear') && (
          <Button asChild>
            <Link href="/usuarios/nuevo">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Link>
          </Button>
        )}
      </div>

      <UsuariosTable
        usuarios={serializados}
        roles={roles.map((r) => ({ id: r.id, nombre: r.nombre }))}
        sucursales={sucursales.map((s) => ({ id: s.id, nombre: s.nombre }))}
      />
    </div>
  )
}