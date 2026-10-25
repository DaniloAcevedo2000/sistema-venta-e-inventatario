import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CajasClient } from './cajas-client'

export const metadata = {
  title: 'Configuración de Cajas | Momoto Café',
}

export default async function CajasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  
  if (!session.user.permisos.includes('configuracion:gestionar') && !session.user.permisos.includes('sucursales:gestionar')) {
    return <div>No tienes permiso para ver esta página.</div>
  }

  const [cajas, sucursales] = await Promise.all([
    prisma.caja.findMany({
      include: { sucursal: { select: { nombre: true } } },
      orderBy: [{ sucursalId: 'asc' }, { orden: 'asc' }],
    }),
    prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Cajas</h1>
        <p className="text-muted-foreground">Administra las cajas físicas de cada sucursal.</p>
      </div>

      <CajasClient 
        cajas={cajas.map(c => ({
          id: c.id,
          nombre: c.nombre,
          codigo: c.codigo,
          sucursalId: c.sucursalId,
          sucursalNombre: c.sucursal.nombre,
          orden: c.orden,
          activa: c.activa
        }))} 
        sucursales={sucursales} 
      />
    </div>
  )
}