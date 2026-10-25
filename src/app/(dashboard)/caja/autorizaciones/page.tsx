// src/app/(dashboard)/caja/autorizaciones/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AutorizacionesClient } from './autorizaciones-client'

export const metadata = { title: 'Autorizaciones | Momoto Café' }

export default async function AutorizacionesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  
  if (!session.user.permisos.includes('caja:autorizar_diferencia')) {
    return <div>No tienes permiso para ver esta página.</div>
  }

  const pendientesRaw = await prisma.sesionCaja.findMany({
    where: { estado: 'POR_AUTORIZAR' },
    include: {
      caja: { select: { nombre: true, codigo: true } },
      usuarioApertura: { select: { nombre: true } },
    },
    orderBy: { fechaSolicitudAutorizacion: 'asc' },
  })

  // 🔴 CONVERTIMOS LOS DATOS A OBJETOS PLANOS (Números y Strings)
  const pendientes = pendientesRaw.map(p => ({
    id: p.id,
    caja: p.caja,
    usuarioApertura: p.usuarioApertura,
    montoInicial: Number(p.montoInicial),
    montoFinal: p.montoFinal ? Number(p.montoFinal) : null,
    montoEsperado: p.montoEsperado ? Number(p.montoEsperado) : null,
    diferencia: Number(p.diferencia),
    motivoDiferencia: p.motivoDiferencia,
    comentarioCajero: p.comentarioCajero,
    fechaSolicitudAutorizacion: p.fechaSolicitudAutorizacion?.toISOString() || null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Autorizaciones Pendientes</h1>
        <p className="text-muted-foreground">Revisa y aprueba las cajas con diferencias.</p>
      </div>

      <AutorizacionesClient pendientes={pendientes} />
    </div>
  )
}