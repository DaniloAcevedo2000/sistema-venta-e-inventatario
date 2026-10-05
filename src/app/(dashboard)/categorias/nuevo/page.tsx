import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoriaForm } from '../categoria-form'

export const metadata = {
  title: 'Nueva Categoría | Momoto Café',
}

export default async function NuevaCategoriaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('categorias:gestionar')) redirect('/categorias')

  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    select: { id: true, codigo: true, nombre: true, descripcion: true, padreId: true, icono: true, color: true, orden: true, activo: true },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/categorias">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Categoría</h1>
          <p className="text-muted-foreground">
            Crea una nueva categoría de productos
          </p>
        </div>
      </div>

      <CategoriaForm categorias={categorias} />
    </div>
  )
}