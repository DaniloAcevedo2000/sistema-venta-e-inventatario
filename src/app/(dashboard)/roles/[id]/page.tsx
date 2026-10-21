import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { RolForm } from '../rol-form'

export default async function EditarRolPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('roles:gestionar')) redirect('/roles')

  const { id } = await params

  // 1. Buscamos el rol con sus permisos
  const rol = await prisma.rol.findUnique({
    where: { id },
    include: {
      permisos: { select: { permisoId: true } },
    },
  })

  if (!rol) notFound()

  // 2. Buscamos todos los permisos para el formulario
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
        <h1 className="text-2xl font-bold tracking-tight">Editar Rol: {rol.nombre}</h1>
        <p className="text-muted-foreground">Modifica los datos y permisos de este rol.</p>
      </div>
      <RolForm permisosAgrupados={permisosAgrupados} initialData={rol} />
    </div>
  )
}