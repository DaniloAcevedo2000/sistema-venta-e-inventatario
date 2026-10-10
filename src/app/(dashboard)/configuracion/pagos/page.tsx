import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PagosTabs } from './pagos-tabs'

export const metadata = {
  title: 'Configuración de Pagos | Momoto Café',
}

export default async function PagosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('configuracion:gestionar')) {
    redirect('/dashboard')
  }

  const [bancos, metodosPago, redesTarjeta, tasaActual, historialTasas] =
    await Promise.all([
      prisma.banco.findMany({
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      }),
      prisma.metodoPago.findMany({
        include: { moneda: true },
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      }),
      prisma.redTarjeta.findMany({
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      }),
      prisma.tasaCambio.findFirst({
        where: {
          monedaOrigen: 'USD',
          monedaDestino: 'NIO',
          activa: true,
        },
        orderBy: { vigenteDesde: 'desc' },
      }),
      prisma.tasaCambio.findMany({
        where: {
          monedaOrigen: 'USD',
          monedaDestino: 'NIO',
        },
        orderBy: { vigenteDesde: 'desc' },
        take: 30,
      }),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Configuración de Pagos
        </h1>
        <p className="text-muted-foreground">
          Administra bancos, métodos de pago, redes de tarjeta y tasa de cambio
        </p>
      </div>

      <PagosTabs
        bancos={bancos.map((b) => ({
          id: b.id,
          codigo: b.codigo,
          nombre: b.nombre,
          nombreCorto: b.nombreCorto,
          permiteTarjeta: b.permiteTarjeta,
          permiteTransferencia: b.permiteTransferencia,
          orden: b.orden,
          activo: b.activo,
        }))}
        metodosPago={metodosPago.map((m) => ({
          id: m.id,
          codigo: m.codigo,
          nombre: m.nombre,
          descripcion: m.descripcion,
          tipo: m.tipo,
          requiereBanco: m.requiereBanco,
          requiereRed: m.requiereRed,
          requiereReferencia: m.requiereReferencia,
          esCredito: m.esCredito,
          icono: m.icono,
          orden: m.orden,
          activo: m.activo,
        }))}
        redesTarjeta={redesTarjeta.map((r) => ({
          id: r.id,
          codigo: r.codigo,
          nombre: r.nombre,
          orden: r.orden,
          activo: r.activo,
        }))}
        tasaActual={
          tasaActual
            ? {
                id: tasaActual.id,
                tasa: Number(tasaActual.tasa),
                vigenteDesde: tasaActual.vigenteDesde.toISOString(),
                fuente: tasaActual.fuente,
                notas: tasaActual.notas,
              }
            : null
        }
        historialTasas={historialTasas.map((t) => ({
          id: t.id,
          tasa: Number(t.tasa),
          fuente: t.fuente,
          vigenteDesde: t.vigenteDesde.toISOString(),
          vigenteHasta: t.vigenteHasta?.toISOString() ?? null,
          activa: t.activa,
          notas: t.notas,
        }))}
      />
    </div>
  )
}