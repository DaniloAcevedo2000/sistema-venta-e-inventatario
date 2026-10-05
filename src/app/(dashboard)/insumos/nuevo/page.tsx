import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InsumoForm } from '../insumo-form'

export const metadata = {
  title: 'Nuevo Insumo | Momoto Café',
}

export default async function NuevoInsumoPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('inventario:ajustar')) redirect('/insumos')

  const unidadesMedida = await prisma.unidadMedida.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/insumos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Insumo</h1>
          <p className="text-muted-foreground">
            Registra un nuevo insumo en el sistema
          </p>
        </div>
      </div>

      <InsumoForm unidadesMedida={unidadesMedida} />
    </div>
  )
}