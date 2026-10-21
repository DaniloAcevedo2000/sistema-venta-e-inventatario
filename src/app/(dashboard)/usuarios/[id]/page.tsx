import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { UsuarioForm } from '../usuario-form'

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('usuarios:editar')) redirect('/usuarios')

  const { id } = await params

  // 1. Buscamos el usuario
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { roles: true },
  })

  if (!usuario) notFound()

  // 2. Buscamos roles y sucursales
  const roles = await prisma.rol.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } })
  const sucursales = await prisma.sucursal.findMany({ where: { activa: true } })

  // 3. Preparamos los datos iniciales (incluyendo el rol)
  const initialData = {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    sucursalId: usuario.sucursalId,
    rolId: usuario.roles[0]?.rolId || null,
    activo: usuario.activo,
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Usuario: {usuario.nombre}</h1>
        <p className="text-muted-foreground">Modifica los datos y accesos de este usuario.</p>
      </div>
      <UsuarioForm roles={roles} sucursales={sucursales} initialData={initialData} />
    </div>
  )
}