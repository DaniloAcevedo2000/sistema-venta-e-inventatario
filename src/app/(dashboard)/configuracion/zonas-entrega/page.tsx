import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ZonasTab } from './zonas-tab'

export const metadata = {
  title: 'Zonas de Entrega | Momoto Café',
}

export default async function ZonasEntregaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('zonas_entrega:gestionar')) {
    redirect('/dashboard')
  }

  const zonas = await prisma.zonaEntrega.findMany({
    include: {
      _count: {
        select: { pedidos: true },
      },
    },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zonas de Entrega</h1>
        <p className="text-muted-foreground">
          Configura las zonas y tarifas de envío a domicilio
        </p>
      </div>

      <ZonasTab
        zonas={zonas.map((z) => ({
          id: z.id,
          codigo: z.codigo,
          nombre: z.nombre,
          descripcion: z.descripcion,
          tarifa: Number(z.tarifa),
          tiempoEstimadoMin: z.tiempoEstimadoMin,
          color: z.color,
          orden: z.orden,
          activa: z.activa,
          cantidadPedidos: z._count.pedidos,
        }))}
      />
    </div>
  )
}