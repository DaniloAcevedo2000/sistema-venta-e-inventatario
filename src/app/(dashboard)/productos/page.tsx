import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProductosTable } from './productos-table'

export const metadata = {
  title: 'Productos | Momoto Café',
}

export default async function ProductosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const puedeVer = session.user.permisos.includes('productos:leer')
  if (!puedeVer) redirect('/dashboard')

  // Cargar categorías para filtros
  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true, codigo: true, padreId: true },
  })

  // Cargar productos con categoría y conteo de variantes
  const productos = await prisma.producto.findMany({
    include: {
      categoria: {
        select: { id: true, nombre: true, codigo: true },
      },
      _count: {
        select: { variantes: true },
      },
    },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    take: 1000, // Limitar para no sobrecargar
  })

  // Serializar Decimals a string para pasar al cliente
  const productosSerializados = productos.map((p) => ({
    ...p,
    precioBase: p.precioBase.toString(),
    costo: p.costo.toString(),
    creadoEn: p.creadoEn.toISOString(),
    actualizadoEn: p.actualizadoEn.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
        <p className="text-muted-foreground">
          Gestiona el catálogo de productos del sistema
        </p>
      </div>

      <ProductosTable
        productos={productosSerializados}
        categorias={categorias}
        permisos={session.user.permisos}
      />
    </div>
  )
}