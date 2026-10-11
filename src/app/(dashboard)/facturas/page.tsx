import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FacturasTable } from './facturas-table'

export const metadata = {
  title: 'Facturas | Momoto Café',
}

export default async function FacturasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('facturas:leer')) redirect('/dashboard')

  const facturas = await prisma.factura.findMany({
    include: {
      sucursal: { select: { nombre: true } },
      venta: {
        select: {
          numero: true,
          usuario: { select: { nombre: true } },
          notasCredito: {
            select: { id: true, numero: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { creadoEn: 'desc' },
    take: 500,
  })

  const facturasSerializadas = facturas.map((f) => {
    const fecha = f.creadoEn
    const nc = f.venta.notasCredito[0]

    return {
      id: f.id,
      numeroCompleto: f.numeroCompleto,
      serie: f.serie,
      numero: f.numero,
      tipoDocumento: f.tipoDocumento,
      estado: f.estado,
      clienteNombre: f.clienteNombre,
      clienteRuc: f.clienteRuc,
      fecha: new Intl.DateTimeFormat('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(fecha),
      hora: new Intl.DateTimeFormat('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(fecha),
      fechaISO: fecha.toISOString(),
      subtotal: Number(f.subtotal),
      iva: Number(f.iva),
      total: Number(f.total),
      sucursalNombre: f.sucursal.nombre,
      cajeroNombre: f.venta.usuario.nombre,
      ventaNumero: f.venta.numero,
      ventaId: f.ventaId,
      anuladaEn: f.anuladaEn?.toISOString() ?? null,
      motivoAnulacion: f.motivoAnulacion,
      tieneNotaCredito: !!nc,
      notaCreditoNumero: nc?.numero ?? null,
    }
  })

  // Stats
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

  const [facturasHoy, facturasMes] = await Promise.all([
    prisma.factura.aggregate({
      where: {
        creadoEn: { gte: hoy },
        estado: 'EMITIDA',
      },
      _sum: { total: true, iva: true },
      _count: true,
    }),
    prisma.factura.aggregate({
      where: {
        creadoEn: { gte: inicioMes },
        estado: 'EMITIDA',
      },
      _sum: { total: true, iva: true },
      _count: true,
    }),
  ])

  const totalFacturadoMes = Number(facturasMes._sum.total ?? 0)
  const totalIvaMes = Number(facturasMes._sum.iva ?? 0)
  const cantidadFacturasMes = facturasMes._count

  const facturasAnuladas = facturas.filter(
    (f) => f.estado === 'ANULADA'
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
        <p className="text-muted-foreground">
          Historial completo de facturación
        </p>
      </div>

      <FacturasTable
        facturas={facturasSerializadas}
        permisos={session.user.permisos}
        stats={{
          totalFacturadoMes,
          totalIvaMes,
          cantidadFacturasMes,
          facturasAnuladas,
        }}
      />
    </div>
  )
}