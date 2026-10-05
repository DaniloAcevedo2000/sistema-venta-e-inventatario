import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoriaForm } from '../categoria-form'

export const metadata = {
  title: 'Editar Categoría | Momoto Café',
}

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('categorias:gestionar')) {
    redirect('/categorias')
  }

  const [categoria, categorias] = await Promise.all([
    prisma.categoria.findUnique({
      where: { id },
    }),
    prisma.categoria.findMany({
      where: {
        activo: true,
        NOT: { id },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        padreId: true,
        icono: true,
        color: true,
        orden: true,
        activo: true,
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    }),
  ])

  if (!categoria) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/categorias">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Editar Categoría
          </h1>
          <p className="text-muted-foreground">
            {categoria.codigo} — {categoria.nombre}
          </p>
        </div>
      </div>

      <CategoriaForm
        categorias={categorias}
        categoria={{
          id: categoria.id,
          codigo: categoria.codigo,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          padreId: categoria.padreId,
          icono: categoria.icono,
          color: categoria.color,
          orden: categoria.orden,
          activo: categoria.activo,
        }}
      />
    </div>
  )
}