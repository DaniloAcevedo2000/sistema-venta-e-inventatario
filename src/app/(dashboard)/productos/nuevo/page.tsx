import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductoForm } from '../producto-form'

export const metadata = {
  title: 'Nuevo Producto | Momoto Café',
}

export default async function NuevoProductoPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  if (!session.user.permisos.includes('productos:crear')) {
    redirect('/productos')
  }

  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    select: { id: true, nombre: true, codigo: true, padreId: true },
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/productos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Producto</h1>
          <p className="text-muted-foreground">
            Completa la información para crear un nuevo producto
          </p>
        </div>
      </div>

      <ProductoForm categorias={categorias} />
    </div>
  )
}