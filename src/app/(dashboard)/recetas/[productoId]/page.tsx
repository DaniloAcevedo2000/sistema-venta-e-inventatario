import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecetaForm } from '../receta-form'

export const metadata = {
  title: 'Editar Receta | Momoto Café',
}

export default async function RecetaPage({
  params,
}: {
  params: Promise<{ productoId: string }>
}) {
  const { productoId } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('productos:editar')) redirect('/recetas')

  const [producto, insumos, unidadesMedida, receta] = await Promise.all([
    prisma.producto.findUnique({
      where: { id: productoId },
      include: {
        categoria: { select: { nombre: true } },
      },
    }),
    prisma.insumo.findMany({
      where: { activo: true },
      include: {
        unidadMedida: {
          select: { id: true, codigo: true, abreviatura: true, nombre: true },
        },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.unidadMedida.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.receta.findUnique({
      where: { productoId },
      include: { items: true },
    }),
  ])

  if (!producto) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recetas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {receta ? 'Editar Receta' : 'Nueva Receta'}
          </h1>
          <p className="text-muted-foreground">
            {producto.codigo} — {producto.nombre}
          </p>
        </div>
      </div>

      <RecetaForm
        producto={{
          id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          precioBase: producto.precioBase.toString(),
          costo: producto.costo.toString(),
          imagenUrl: producto.imagenUrl,
          color: producto.color,
          categoria: producto.categoria,
        }}
        insumos={insumos.map((i) => ({
          id: i.id,
          codigo: i.codigo,
          nombre: i.nombre,
          unidadMedidaId: i.unidadMedidaId,
          costoUnitario: i.costoUnitario.toString(),
          unidadMedida: i.unidadMedida,
        }))}
        unidadesMedida={unidadesMedida}
        receta={
          receta
            ? {
                id: receta.id,
                productoId: receta.productoId,
                notas: receta.notas,
                activa: receta.activa,
                items: receta.items.map((item) => ({
                  id: item.id,
                  insumoId: item.insumoId,
                  cantidad: item.cantidad.toString(),
                  unidadMedidaId: item.unidadMedidaId,
                  mermaPorcentaje: item.mermaPorcentaje.toString(),
                })),
              }
            : undefined
        }
      />
    </div>
  )
}