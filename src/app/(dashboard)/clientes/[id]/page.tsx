import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClienteForm } from '../cliente-form'

export const metadata = {
  title: 'Editar Cliente | Momoto Café',
}

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('clientes:editar')) redirect('/clientes')

  const cliente = await prisma.cliente.findUnique({ where: { id } })
  if (!cliente) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-muted-foreground">
            {cliente.codigo} — {cliente.nombreComercial || cliente.nombre}
          </p>
        </div>
      </div>

      <ClienteForm
        cliente={{
          id: cliente.id,
          codigo: cliente.codigo,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          nombreComercial: cliente.nombreComercial,
          tipoDocumento: cliente.tipoDocumento,
          numeroDocumento: cliente.numeroDocumento,
          telefono: cliente.telefono,
          correo: cliente.correo,
          direccion: cliente.direccion,
          permiteCredito: cliente.permiteCredito,
          limiteCredito: cliente.limiteCredito.toString(),
          notas: cliente.notas,
          activo: cliente.activo,
        }}
      />
    </div>
  )
}