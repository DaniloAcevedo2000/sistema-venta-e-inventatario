import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UsuarioForm } from '../usuario-form'

export default async function NuevoUsuarioPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('usuarios:crear')) redirect('/usuarios')

  const roles = await prisma.rol.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } })
  const sucursales = await prisma.sucursal.findMany({ where: { activa: true } })

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Usuario</h1>
        <p className="text-muted-foreground">Registra un nuevo miembro para el equipo.</p>
      </div>
      <UsuarioForm roles={roles} sucursales={sucursales} />
    </div>
  )
}