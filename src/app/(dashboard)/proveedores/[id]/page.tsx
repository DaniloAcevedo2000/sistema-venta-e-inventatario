import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { ProveedorForm } from '../proveedor-form'

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('compras:editar')) redirect('/proveedores')

  const { id } = await params

  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
  })

  if (!proveedor) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Proveedor</h1>
        <p className="text-muted-foreground">
          Modifica los datos de {proveedor.nombre}
        </p>
      </div>
      <ProveedorForm proveedor={proveedor} />
    </div>
  )
}