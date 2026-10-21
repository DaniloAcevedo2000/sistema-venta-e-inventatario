import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NuevaOrdenClient } from './nueva-orden-client'

export const metadata = { title: 'Nueva Compra | Momoto Café' }

export default async function NuevaOrdenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('compras:crear')) redirect('/compras')

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  const insumos = await prisma.insumo.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      costoUnitario: true,
      unidadMedida: { select: { abreviatura: true } }
    }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Orden de Compra</h1>
        <p className="text-muted-foreground">Selecciona el proveedor y los insumos a adquirir</p>
      </div>
      
      <NuevaOrdenClient 
        proveedores={proveedores.map(p => ({ id: p.id, nombre: p.nombre }))} 
        insumos={insumos.map(i => ({
          id: i.id,
          codigo: i.codigo,
          nombre: i.nombre,
          costoUnitario: Number(i.costoUnitario),
          unidad: i.unidadMedida.abreviatura
        }))} 
      />
    </div>
  )
}