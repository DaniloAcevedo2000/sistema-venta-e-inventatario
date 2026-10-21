import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RolForm } from '../rol-form'

export default async function NuevoRolPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('roles:gestionar')) redirect('/roles')

  const permisos = await prisma.permiso.findMany({
    orderBy: [{ grupo: 'asc' }, { nombre: 'asc' }],
  })

  const permisosAgrupados = permisos.reduce((acc, permiso) => {
    if (!acc[permiso.grupo]) acc[permiso.grupo] = []
    acc[permiso.grupo].push(permiso)
    return acc
  }, {} as Record<string, typeof permisos>)

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Rol</h1>
        <p className="text-muted-foreground">Configura los accesos para este rol.</p>
      </div>
      <RolForm permisosAgrupados={permisosAgrupados} />
    </div>
  )
}