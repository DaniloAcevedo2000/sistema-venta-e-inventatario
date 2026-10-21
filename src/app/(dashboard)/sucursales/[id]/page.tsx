import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { SucursalForm } from '../sucursal-form'

export default async function EditarSucursalPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('sucursales:gestionar')) redirect('/sucursales')

  const { id } = await params
  const sucursal = await prisma.sucursal.findUnique({ where: { id } })
  if (!sucursal) notFound()

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Sucursal: {sucursal.nombre}</h1>
        <p className="text-muted-foreground">Modifica los datos del local.</p>
      </div>
      <SucursalForm initialData={sucursal} />
    </div>
  )
}