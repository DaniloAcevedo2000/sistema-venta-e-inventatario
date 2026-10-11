import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ClientesTable } from './clientes-table'

export const metadata = {
  title: 'Clientes | Momoto Café',
}

export default async function ClientesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.permisos.includes('clientes:leer')) redirect('/dashboard')

  const clientes = await prisma.cliente.findMany({
    include: {
      _count: { select: { ventas: true } },
      ventas: {
        orderBy: { creadoEn: 'desc' },
        take: 1,
        select: { creadoEn: true },
      },
    },
    orderBy: { nombre: 'asc' },
    take: 500,
  })

  const clientesSerializados = clientes.map((c) => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    apellido: c.apellido,
    nombreComercial: c.nombreComercial,
    tipoDocumento: c.tipoDocumento,
    numeroDocumento: c.numeroDocumento,
    telefono: c.telefono,
    correo: c.correo,
    direccion: c.direccion,
    permiteCredito: c.permiteCredito,
    limiteCredito: Number(c.limiteCredito),
    saldoActual: Number(c.saldoActual),
    activo: c.activo,
    motivoCambio: c.motivoCambio,
    desactivadoEn: c.desactivadoEn?.toISOString() ?? null,
    cantidadVentas: c._count.ventas,
    ultimaCompra: c.ventas[0]
      ? new Intl.DateTimeFormat('es-NI', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(c.ventas[0].creadoEn)
      : null,
  }))

  // Stats
  const totalClientes = clientes.length
  const activos = clientes.filter((c) => c.activo).length
  const conCredito = clientes.filter((c) => c.permiteCredito).length
  const conSaldo = clientes.filter((c) => Number(c.saldoActual) > 0.01).length
  const totalPorCobrar = clientes.reduce(
    (sum, c) => sum + Number(c.saldoActual),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestión de clientes y créditos
          </p>
        </div>
      </div>

      <ClientesTable
        clientes={clientesSerializados}
        permisos={session.user.permisos}
        stats={{
          totalClientes,
          activos,
          conCredito,
          conSaldo,
          totalPorCobrar,
        }}
      />
    </div>
  )
}