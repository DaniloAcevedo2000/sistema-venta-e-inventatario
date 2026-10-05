import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CategoriasTable } from './categorias-table'

export const metadata = {
  title: 'Categorías | Momoto Café',
}

export default async function CategoriasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  if (!session.user.permisos.includes('categorias:gestionar')) {
    redirect('/dashboard')
  }

  const categorias = await prisma.categoria.findMany({
    include: {
      padre: { select: { id: true, nombre: true } },
      _count: {
        select: {
          productos: true,
          hijas: true,
        },
      },
    },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  })

  const categoriasSerializadas = categorias.map((c) => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    descripcion: c.descripcion,
    icono: c.icono,
    color: c.color,
    orden: c.orden,
    activo: c.activo,
    padreId: c.padreId,
    padre: c.padre,
    _count: c._count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground">
          Gestiona las categorías de productos con jerarquía
        </p>
      </div>

      <CategoriasTable
        categorias={categoriasSerializadas}
        permisos={session.user.permisos}
      />
    </div>
  )
}