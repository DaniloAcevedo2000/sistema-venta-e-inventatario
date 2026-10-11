'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getClienteDetalle(clienteId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      pagosCredito: {
        orderBy: { creadoEn: 'desc' },
        take: 50,
      },
      ventas: {
        include: {
          factura: { select: { numeroCompleto: true } },
          pagos: {
            include: {
              metodoPago: { select: { nombre: true } },
            },
          },
        },
        orderBy: { creadoEn: 'desc' },
        take: 50,
      },
      _count: { select: { ventas: true } },
    },
  })

  if (!cliente) throw new Error('Cliente no encontrado')

  // Obtener el nombre del usuario que desactivó (si aplica)
  let desactivadoPorNombre: string | null = null
  if (cliente.desactivadoPorId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: cliente.desactivadoPorId },
      select: { nombre: true },
    })
    desactivadoPorNombre = usuario?.nombre ?? null
  }

  const totalVentas = cliente.ventas
    .filter((v) => v.estado === 'COMPLETADA')
    .reduce((sum, v) => sum + Number(v.total), 0)

  const saldoActual = Number(cliente.saldoActual)
  const limiteCredito = Number(cliente.limiteCredito)
  const creditoDisponible = Math.max(0, limiteCredito - saldoActual)

  return {
    id: cliente.id,
    codigo: cliente.codigo,
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    nombreComercial: cliente.nombreComercial,
    tipoDocumento: cliente.tipoDocumento,
    numeroDocumento: cliente.numeroDocumento,
    telefono: cliente.telefono,
    correo: cliente.correo,
    direccion: cliente.direccion,
    permiteCredito: cliente.permiteCredito,
    limiteCredito,
    saldoActual,
    creditoDisponible,
    notas: cliente.notas,
    activo: cliente.activo,
    cantidadVentas: cliente._count.ventas,
    totalVentas,

    // Trazabilidad de desactivación
    motivoCambio: cliente.motivoCambio,
    desactivadoEn: cliente.desactivadoEn?.toISOString() ?? null,
    desactivadoPorNombre,

    pagosCredito: cliente.pagosCredito.map((p) => ({
      id: p.id,
      monto: Number(p.monto),
      metodo: p.metodo,
      referencia: p.referencia,
      notas: p.notas,
      saldoAnterior: Number(p.saldoAnterior),
      saldoNuevo: Number(p.saldoNuevo),
      fecha: p.creadoEn.toISOString(),
    })),
    ventas: cliente.ventas.map((v) => ({
      id: v.id,
      numero: v.numero,
      facturaNumero: v.factura?.numeroCompleto ?? null,
      total: Number(v.total),
      estado: v.estado,
      fechaISO: v.creadoEn.toISOString(),
      metodoPago:
        v.pagos[0]?.metodoPago?.nombre ?? v.pagos[0]?.metodoCodigo ?? '—',
    })),
  }
}