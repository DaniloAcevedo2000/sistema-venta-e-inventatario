import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { OrdenDetalleClient } from './orden-detalle-client'

export default async function DetalleOrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('compras:leer')) redirect('/compras')

  const { id } = await params

  const orden = await prisma.ordenCompra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      sucursal: true,
      usuario: { select: { nombre: true } },
      items: {
        include: {
          insumo: { select: { nombre: true, unidadMedida: { select: { abreviatura: true } } } },
          producto: { select: { nombre: true } }
        }
      }
    }
  })

  if (!orden) notFound()

  const data = {
    id: orden.id,
    codigo: orden.codigo,
    proveedor: orden.proveedor.nombre,
    sucursal: orden.sucursal.nombre,
    creadoPor: orden.usuario.nombre,
    fecha: new Intl.DateTimeFormat('es-NI', { dateStyle: 'long', timeStyle: 'short' }).format(orden.creadoEn),
    estado: orden.estado,
    subtotal: Number(orden.subtotal),
    impuesto: Number(orden.impuesto),
    total: Number(orden.total),
    notas: orden.notas,
    items: orden.items.map(i => ({
      id: i.id,
      nombre: i.insumo?.nombre || i.producto?.nombre || i.descripcion,
      unidad: i.insumo?.unidadMedida.abreviatura || 'und',
      cantidadPedida: Number(i.cantidad),
      cantidadRecibida: Number(i.cantidadRecibida),
      precioUnitario: Number(i.precioUnitario),
      subtotal: Number(i.subtotal)
    }))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <OrdenDetalleClient orden={data} permisos={session.user.permisos} />
    </div>
  )
}