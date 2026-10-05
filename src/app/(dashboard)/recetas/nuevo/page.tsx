import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Nueva Receta | Momoto Café',
}

export default async function NuevaRecetaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('productos:editar')) redirect('/recetas')

  // Productos que NO tienen receta y son vendibles
  const productosSinReceta = await prisma.producto.findMany({
    where: {
      activo: true,
      tipo: { in: ['simple', 'variantes'] },
      receta: null,
    },
    include: {
      categoria: { select: { nombre: true } },
    },
    orderBy: { nombre: 'asc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recetas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Receta</h1>
          <p className="text-muted-foreground">
            Selecciona el producto al que le crearás la receta
          </p>
        </div>
      </div>

      {productosSinReceta.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Todos los productos activos ya tienen receta asignada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productosSinReceta.map((producto) => (
            <Link
              key={producto.id}
              href={`/recetas/${producto.id}`}
              className="block group"
            >
              <Card className="h-full hover:border-primary transition-all hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className="h-12 w-12 rounded-md flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: producto.color || '#6B4226' }}
                    >
                      {producto.imagenUrl ? (
                        <img
                          src={producto.imagenUrl}
                          alt={producto.nombre}
                          className="h-full w-full object-cover rounded-md"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1">
                        {producto.nombre}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {producto.codigo}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {producto.categoria.nombre}
                    </Badge>
                    <span className="text-sm font-medium">
                      C$ {Number(producto.precioBase).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}