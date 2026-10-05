import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RecetasTable } from './recetas-table'

export const metadata = {
  title: 'Recetas | Momoto Café',
}

export default async function RecetasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('productos:leer')) redirect('/dashboard')

  const recetas = await prisma.receta.findMany({
    include: {
      producto: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          precioBase: true,
          imagenUrl: true,
          color: true,
          categoria: { select: { nombre: true } },
        },
      },
      items: {
        include: {
          insumo: {
            select: { costoUnitario: true },
          },
        },
      },
    },
    orderBy: { creadoEn: 'desc' },
  })

  const recetasSerializadas = recetas.map((r) => {
    const costoCalculado = r.items.reduce((sum, item) => {
      const cantidad = Number(item.cantidad)
      const costoUnit = Number(item.insumo.costoUnitario)
      const merma = Number(item.mermaPorcentaje)
      return sum + cantidad * costoUnit * (1 + merma / 100)
    }, 0)

    return {
      id: r.id,
      productoId: r.productoId,
      notas: r.notas,
      activa: r.activa,
      producto: {
        id: r.producto.id,
        codigo: r.producto.codigo,
        nombre: r.producto.nombre,
        precioBase: r.producto.precioBase.toString(),
        imagenUrl: r.producto.imagenUrl,
        color: r.producto.color,
        categoria: r.producto.categoria,
      },
      itemsCount: r.items.length,
      costoCalculado: costoCalculado.toFixed(2),
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recetas</h1>
        <p className="text-muted-foreground">
          Configura qué insumos consume cada producto
        </p>
      </div>

      <RecetasTable
        recetas={recetasSerializadas}
        permisos={session.user.permisos}
      />
    </div>
  )
}