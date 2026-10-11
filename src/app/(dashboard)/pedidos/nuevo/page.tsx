import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PedidoForm } from '../pedido-form'

export const metadata = {
  title: 'Nuevo Pedido | Momoto Café',
}

export default async function NuevoPedidoPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('pedidos:crear')) redirect('/pedidos')

  const [categorias, productos, zonas, clientes] = await Promise.all([
    prisma.categoria.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    }),
    prisma.producto.findMany({
      where: { activo: true },
      include: {
        categoria: { select: { id: true, nombre: true } },
        variantes: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    }),
    prisma.zonaEntrega.findMany({
      where: { activa: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        apellido: true,
        nombreComercial: true,
        telefono: true,
        direccion: true,
      },
      orderBy: { nombre: 'asc' },
      take: 500,
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pedidos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Pedido</h1>
          <p className="text-muted-foreground">
            Crea un pedido para delivery o pickup
          </p>
        </div>
      </div>

      <PedidoForm
        categorias={categorias.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          icono: c.icono,
          color: c.color,
          padreId: c.padreId,
        }))}
        productos={productos.map((p) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precioBase: p.precioBase.toString(),
          tipo: p.tipo,
          tipoImpuesto: p.tipoImpuesto,
          imagenUrl: p.imagenUrl,
          color: p.color,
          categoriaId: p.categoriaId,
          categoriaNombre: p.categoria.nombre,
          variantes: p.variantes.map((v) => ({
            id: v.id,
            codigo: v.codigo,
            nombre: v.nombre,
            precio: v.precio.toString(),
            orden: v.orden,
          })),
        }))}
        zonas={zonas.map((z) => ({
          id: z.id,
          codigo: z.codigo,
          nombre: z.nombre,
          tarifa: Number(z.tarifa),
          color: z.color,
        }))}
        clientes={clientes.map((c) => ({
          id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          apellido: c.apellido,
          nombreComercial: c.nombreComercial,
          telefono: c.telefono,
          direccion: c.direccion,
        }))}
      />
    </div>
  )
}