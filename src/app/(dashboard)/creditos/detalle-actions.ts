'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getClienteCreditoDetalle(clienteId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      pagosCredito: {
        orderBy: { creadoEn: 'desc' },
        take: 100,
      },
      ventas: {
        where: { tipo: 'CREDITO' },
        include: {
          factura: { select: { numeroCompleto: true } },
          sesionCaja: { select: { caja: { select: { nombre: true } } } },
          usuario: { select: { nombre: true } },
        },
        orderBy: { creadoEn: 'desc' },
        take: 100,
      },
    },
  })

  if (!cliente) throw new Error('Cliente no encontrado')

  const saldoActual = Number(cliente.saldoActual)
  const limiteCredito = Number(cliente.limiteCredito)
  const creditoDisponible = Math.max(0, limiteCredito - saldoActual)
  const totalComprado = cliente.ventas.reduce(
    (sum, v) => sum + Number(v.total),
    0
  )
  const totalPagado = cliente.pagosCredito.reduce(
    (sum, p) => sum + Number(p.monto),
    0
  )

  return {
    id: cliente.id,
    codigo: cliente.codigo,
    nombre: `${cliente.nombre} ${cliente.apellido ?? ''}`.trim(),
    nombreComercial: cliente.nombreComercial,
    tipoDocumento: cliente.tipoDocumento,
    numeroDocumento: cliente.numeroDocumento,
    telefono: cliente.telefono,
    correo: cliente.correo,
    direccion: cliente.direccion,
    limiteCredito,
    saldoActual,
    creditoDisponible,
    totalComprado,
    totalPagado,
    cantidadCompras: cliente.ventas.length,
    cantidadPagos: cliente.pagosCredito.length,
    ventas: cliente.ventas.map((v) => ({
      id: v.id,
      numero: v.numero,
      facturaNumero: v.factura?.numeroCompleto ?? null,
      total: Number(v.total),
      fecha: v.creadoEn.toISOString(),
      estado: v.estado,
      cajero: v.usuario.nombre,
      caja: v.sesionCaja?.caja?.nombre ?? null,
    })),
    pagos: cliente.pagosCredito.map((p) => ({
      id: p.id,
      monto: Number(p.monto),
      metodo: p.metodo,
      referencia: p.referencia,
      notas: p.notas,
      saldoAnterior: Number(p.saldoAnterior),
      saldoNuevo: Number(p.saldoNuevo),
      fecha: p.creadoEn.toISOString(),
    })),
  }
}