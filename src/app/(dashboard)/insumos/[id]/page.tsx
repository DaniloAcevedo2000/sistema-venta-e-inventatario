import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InsumoForm } from '../insumo-form'

export const metadata = {
  title: 'Editar Insumo | Momoto Café',
}

export default async function EditarInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('inventario:ajustar')) redirect('/insumos')

  const [insumo, unidadesMedida] = await Promise.all([
    prisma.insumo.findUnique({ where: { id } }),
    prisma.unidadMedida.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    }),
  ])

  if (!insumo) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/insumos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Insumo</h1>
          <p className="text-muted-foreground">
            {insumo.codigo} — {insumo.nombre}
          </p>
        </div>
      </div>

      <InsumoForm
        unidadesMedida={unidadesMedida}
        insumo={{
          id: insumo.id,
          codigo: insumo.codigo,
          nombre: insumo.nombre,
          descripcion: insumo.descripcion,
          unidadMedidaId: insumo.unidadMedidaId,
          categoriaInsumo: insumo.categoriaInsumo,
          costoUnitario: insumo.costoUnitario.toString(),
          stockMinimo: insumo.stockMinimo.toString(),
          imagenUrl: insumo.imagenUrl,
          activo: insumo.activo,
        }}
      />
    </div>
  )
}