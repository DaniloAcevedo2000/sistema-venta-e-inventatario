import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CajaDashboard } from './caja-dashboard'

export const metadata = {
  title: 'Caja | Momoto Café',
}

export default async function CajaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('caja:ver')) redirect('/dashboard')

  if (!session.user.sucursalId) {
    return <div>Usuario sin sucursal asignada</div>
  }

  // ============================================
  // DETERMINAR SI PUEDE VER TODAS LAS SESIONES
  // ============================================
  const roles = session.user.roles ?? []
  const puedeVerTodas =
    session.user.permisos.includes('caja:ver_todas') ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('ADMIN') ||
    roles.includes('GERENTE')

  // Cajas de la sucursal
  const cajas = await prisma.caja.findMany({
    where: {
      sucursalId: session.user.sucursalId,
      activa: true,
    },
    orderBy: { orden: 'asc' },
    include: {
      sesiones: {
        where: { estado: 'ABIERTA' },
        include: {
          usuarioApertura: { select: { id: true, nombre: true } },
          _count: { select: { ventas: true } },
        },
      },
    },
  })

  // Mis sesiones abiertas
  const misSesiones = await prisma.sesionCaja.findMany({
    where: {
      usuarioAperturaId: session.user.id,
      estado: 'ABIERTA',
    },
    include: {
      caja: { select: { nombre: true, codigo: true } },
    },
  })

  // Sesiones recientes (filtradas por sucursal, y por usuario si es cajero)
  const sesionesRecientes = await prisma.sesionCaja.findMany({
    where: {
      sucursalId: session.user.sucursalId,
      ...(!puedeVerTodas && { usuarioAperturaId: session.user.id }),
    },
    include: {
      caja: { select: { nombre: true, codigo: true } },
      usuarioApertura: { select: { nombre: true } },
      _count: { select: { ventas: true, movimientos: true } },
    },
    orderBy: { fechaApertura: 'desc' },
    take: 30,
  })

  // Stats del día
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const sesionesHoy = await prisma.sesionCaja.findMany({
    where: {
      sucursalId: session.user.sucursalId,
      fechaApertura: { gte: hoy },
      ...(!puedeVerTodas && { usuarioAperturaId: session.user.id }),
    },
  })

  const totalVentasHoy = sesionesHoy.reduce(
    (sum, s) => sum + Number(s.totalVentas),
    0
  )
  const efectivoHoy = sesionesHoy.reduce(
    (sum, s) => sum + Number(s.totalEfectivo),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
        <p className="text-muted-foreground">
          {puedeVerTodas
            ? 'Apertura, cierre y control de caja de la sucursal'
            : 'Tus sesiones de caja'}
        </p>
      </div>

      <CajaDashboard
        cajas={cajas.map((c) => ({
          id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          sesionAbierta: c.sesiones[0]
            ? {
                id: c.sesiones[0].id,
                usuarioId: c.sesiones[0].usuarioApertura.id,
                usuarioNombre: c.sesiones[0].usuarioApertura.nombre,
                fechaApertura: c.sesiones[0].fechaApertura.toISOString(),
                montoInicial: Number(c.sesiones[0].montoInicial),
                cantidadVentas: c.sesiones[0]._count.ventas,
              }
            : null,
        }))}
        misSesiones={misSesiones.map((s) => ({
          id: s.id,
          cajaNombre: s.caja.nombre,
          cajaCodigo: s.caja.codigo,
          fechaApertura: s.fechaApertura.toISOString(),
          montoInicial: Number(s.montoInicial),
        }))}
        sesionesRecientes={sesionesRecientes.map((s) => ({
          id: s.id,
          cajaNombre: s.caja.nombre,
          cajaCodigo: s.caja.codigo,
          usuarioNombre: s.usuarioApertura.nombre,
          fechaApertura: s.fechaApertura.toISOString(),
          fechaCierre: s.fechaCierre?.toISOString() ?? null,
          montoInicial: Number(s.montoInicial),
          montoFinal: s.montoFinal ? Number(s.montoFinal) : null,
          montoEsperado: s.montoEsperado ? Number(s.montoEsperado) : null,
          diferencia: s.diferencia ? Number(s.diferencia) : null,
          totalVentas: Number(s.totalVentas),
          cantidadVentas: s._count.ventas,
          cantidadMovimientos: s._count.movimientos,
          estado: s.estado,
        }))}
        permisos={session.user.permisos}
        usuarioActualId={session.user.id}
        puedeVerTodas={puedeVerTodas}
        stats={{
          totalVentasHoy,
          efectivoHoy,
          sesionesAbiertas: sesionesHoy.filter((s) => s.estado === 'ABIERTA')
            .length,
        }}
      />
    </div>
  )
}