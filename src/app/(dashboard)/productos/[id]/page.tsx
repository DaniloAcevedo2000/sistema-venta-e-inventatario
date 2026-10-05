import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductoForm } from '../producto-form'

export const metadata = {
  title: 'Editar Producto | Momoto Café',
}

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  if (!session.user.permisos.includes('productos:editar')) {
    redirect('/productos')
  }

  const [producto, categorias] = await Promise.all([
    prisma.producto.findUnique({
      where: { id },
      include: {
        variantes: { orderBy: { orden: 'asc' } },
      },
    }),
    prisma.categoria.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: { id: true, nombre: true, codigo: true, padreId: true },
    }),
  ])

  if (!producto) notFound()

  // Serializar Decimals
  const productoSerializado = {
    id: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? '',
    categoriaId: producto.categoriaId,
    tipo: producto.tipo,
    precioBase: producto.precioBase.toString(),
    costo: producto.costo.toString(),
    tipoImpuesto: producto.tipoImpuesto,
    imagenUrl: producto.imagenUrl ?? '',
    color: producto.color ?? '',
    codigoBarras: producto.codigoBarras ?? '',
    activo: producto.activo,
    destacado: producto.destacado,
    permiteDescuento: producto.permiteDescuento,
    orden: producto.orden,
    variantes: producto.variantes.map((v) => ({
      id: v.id,
      codigo: v.codigo,
      nombre: v.nombre,
      precio: v.precio.toString(),
      costo: v.costo.toString(),
      orden: v.orden,
      activo: v.activo,
    })),
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/productos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Producto</h1>
          <p className="text-muted-foreground">
            {producto.codigo} — {producto.nombre}
          </p>
        </div>
      </div>

      <ProductoForm
        categorias={categorias}
        producto={productoSerializado}
      />
    </div>
  )
}