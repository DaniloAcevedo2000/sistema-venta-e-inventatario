import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CreditosTable } from './creditos-table'

export const metadata = {
  title: 'Créditos | Momoto Café',
}

export default async function CreditosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('creditos:leer')) redirect('/dashboard')

  // Solo clientes con saldo pendiente
  const clientes = await prisma.cliente.findMany({
    where: {
      activo: true,
      permiteCredito: true,
      saldoActual: { gt: 0.01 },
    },
    include: {
      ventas: {
        where: { tipo: 'CREDITO' },
        select: {
          creadoEn: true,
          total: true,
        },
        orderBy: { creadoEn: 'desc' },
      },
      pagosCredito: {
        select: { creadoEn: true },
        orderBy: { creadoEn: 'desc' },
        take: 1,
      },
    },
    orderBy: { saldoActual: 'desc' },
  })

  const hoy = new Date()

  const creditosSerializados = clientes.map((c) => {
    const saldoActual = Number(c.saldoActual)
    const limiteCredito = Number(c.limiteCredito)
    const creditoDisponible = Math.max(0, limiteCredito - saldoActual)
    const porcentajeUsado =
      limiteCredito > 0 ? (saldoActual / limiteCredito) * 100 : 0

    // Días sin pagar: desde la última compra o el último pago
    const ultimaCompra = c.ventas[0]?.creadoEn
    const ultimoPago = c.pagosCredito[0]?.creadoEn

    let fechaReferencia = ultimaCompra
    if (ultimoPago && (!fechaReferencia || ultimoPago > fechaReferencia)) {
      fechaReferencia = ultimoPago
    }

    const diasSinPagar = fechaReferencia
      ? Math.floor(
          (hoy.getTime() - fechaReferencia.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null

    let estado: 'al_dia' | 'activo' | 'limite_alcanzado' = 'activo'
    if (porcentajeUsado >= 100) estado = 'limite_alcanzado'
    else if (saldoActual < 0.01) estado = 'al_dia'

    return {
      id: c.id,
      codigo: c.codigo,
      nombre: `${c.nombre} ${c.apellido ?? ''}`.trim(),
      nombreComercial: c.nombreComercial,
      telefono: c.telefono,
      correo: c.correo,
      tipoDocumento: c.tipoDocumento,
      numeroDocumento: c.numeroDocumento,
      limiteCredito,
      saldoActual,
      creditoDisponible,
      porcentajeUsado,
      cantidadComprasCredito: c.ventas.length,
      ultimaCompra: ultimaCompra
        ? new Intl.DateTimeFormat('es-NI', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(ultimaCompra)
        : null,
      diasSinPagar,
      estado,
    }
  })

  // Stats
  const totalPorCobrar = creditosSerializados.reduce(
    (sum, c) => sum + c.saldoActual,
    0
  )
  const clientesConSaldo = creditosSerializados.length
  const clientesEnLimite = creditosSerializados.filter(
    (c) => c.estado === 'limite_alcanzado'
  ).length
  const saldoPromedio =
    clientesConSaldo > 0 ? totalPorCobrar / clientesConSaldo : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Créditos</h1>
        <p className="text-muted-foreground">
          Control de cuentas por cobrar y gestión de pagos
        </p>
      </div>

      <CreditosTable
        creditos={creditosSerializados}
        permisos={session.user.permisos}
        stats={{
          totalPorCobrar,
          clientesConSaldo,
          clientesEnLimite,
          saldoPromedio,
        }}
      />
    </div>
  )
}