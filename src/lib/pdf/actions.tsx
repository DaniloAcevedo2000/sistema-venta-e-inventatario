'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { BoucherTicket, type DatosFactura } from './boucher-ticket'
import { FacturaA4 } from './factura-a4'
import { NotaCreditoA4, NotaCreditoBoucher, type DatosNotaCredito } from './nota-credito'

// ============================================
// OBTENER DATOS DE FACTURA
// ============================================
export async function obtenerDatosFactura(facturaId: string): Promise<DatosFactura> {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      venta: {
        include: {
          items: true,
          pagos: {
            include: {
              metodoPago: true,
              banco: true,
              redTarjeta: true,
            },
          },
          usuario: { select: { nombre: true } },
        },
      },
      sucursal: true,
    },
  })

  if (!factura) throw new Error('Factura no encontrada')

  // Obtener datos del negocio
  const configs = await prisma.configuracion.findMany({
    where: {
      clave: {
        in: [
          'negocio.nombre_comercial',
          'negocio.nombre_legal',
          'negocio.ruc',
          'negocio.direccion',
          'negocio.telefono',
          'negocio.correo',
        ],
      },
    },
  })

  const getConfig = (clave: string) =>
    configs.find((c) => c.clave === clave)?.valor ?? ''

  const pago = factura.venta.pagos[0]

  return {
    negocio: {
      nombreComercial: getConfig('negocio.nombre_comercial'),
      nombreLegal: getConfig('negocio.nombre_legal'),
      ruc: getConfig('negocio.ruc'),
      direccion: getConfig('negocio.direccion'),
      telefono: getConfig('negocio.telefono'),
      correo: getConfig('negocio.correo'),
    },
    factura: {
      numero: factura.numeroCompleto,
      serie: factura.serie,
      fecha: new Intl.DateTimeFormat('es-NI', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(factura.creadoEn),
      autorizacionDgi: factura.autorizacionId ?? undefined,
    },
    venta: {
      numero: factura.venta.numero,
      tipoDocumento: factura.tipoDocumento,
    },
    cajero: factura.venta.usuario.nombre,
    sucursal: factura.sucursal.nombre,
    cliente: {
      nombre: factura.clienteNombre,
      ruc: factura.clienteRuc ?? undefined,
      direccion: factura.clienteDireccion ?? undefined,
    },
    items: factura.venta.items.map((item) => ({
      cantidad: Number(item.cantidad),
      descripcion: item.nombreProducto,
      variante: item.nombreVariante ?? undefined,
      notas: item.notas ?? undefined,
      precioUnitario: Number(item.precioUnitario),
      total: Number(item.total),
    })),
    totales: {
      subtotal: Number(factura.subtotal),
      descuento: Number(factura.descuento),
      subtotalGravado: Number(factura.subtotalGravado),
      iva: Number(factura.iva),
      subtotalExento: Number(factura.subtotalExento),
      total: Number(factura.total),
    },
    pago: {
      metodo: pago?.metodoPago?.nombre ?? pago?.metodoCodigo ?? 'Efectivo',
      montoRecibido: Number(pago?.monto ?? 0),
      cambio: 0, // TODO: calcular del payload original
      banco: pago?.banco?.nombre,
      redTarjeta: pago?.redTarjeta?.nombre,
      referencia: pago?.referencia ?? undefined,
    },
  }
}

// ============================================
// GENERAR PDF BOUCHER (return base64)
// ============================================
export async function generarBoucherPDF(facturaId: string) {
  const datos = await obtenerDatosFactura(facturaId)
  const buffer = await renderToBuffer(<BoucherTicket datos={datos} />)
  return Buffer.from(buffer).toString('base64')
}

// ============================================
// GENERAR PDF A4 (return base64)
// ============================================
export async function generarFacturaA4PDF(facturaId: string) {
  const datos = await obtenerDatosFactura(facturaId)
  const buffer = await renderToBuffer(<FacturaA4 datos={datos} />)
  return Buffer.from(buffer).toString('base64')
}




// ============================================
// OBTENER DATOS DE NOTA DE CRÉDITO
// ============================================
export async function obtenerDatosNotaCredito(
  notaCreditoId: string
): Promise<DatosNotaCredito> {
  const session = await auth()
  if (!session?.user) throw new Error('No autenticado')

  const nc = await prisma.notaCredito.findUnique({
    where: { id: notaCreditoId },
    include: {
      facturaOriginal: true,
      venta: {
        include: {
          items: true,
          usuario: { select: { nombre: true } },
        },
      },
      sucursal: true,
      usuario: { select: { nombre: true } },
    },
  })

  if (!nc) throw new Error('Nota de crédito no encontrada')

  // Obtener datos del negocio
  const configs = await prisma.configuracion.findMany({
    where: {
      clave: {
        in: [
          'negocio.nombre_comercial',
          'negocio.nombre_legal',
          'negocio.ruc',
          'negocio.direccion',
          'negocio.telefono',
          'negocio.correo',
        ],
      },
    },
  })

  const getConfig = (clave: string) =>
    configs.find((c) => c.clave === clave)?.valor ?? ''

  return {
    negocio: {
      nombreComercial: getConfig('negocio.nombre_comercial'),
      nombreLegal: getConfig('negocio.nombre_legal'),
      ruc: getConfig('negocio.ruc'),
      direccion: getConfig('negocio.direccion'),
      telefono: getConfig('negocio.telefono'),
      correo: getConfig('negocio.correo'),
    },
    notaCredito: {
      numero: nc.numero,
      fecha: new Intl.DateTimeFormat('es-NI', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(nc.fechaEmision),
      motivo: nc.motivo,
    },
    facturaOriginal: {
      numero: nc.facturaOriginal.numeroCompleto,
      fecha: new Intl.DateTimeFormat('es-NI', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(nc.facturaOriginal.creadoEn),
    },
    venta: {
      numero: nc.venta.numero,
    },
    cajero: nc.venta.usuario.nombre,
    sucursal: nc.sucursal.nombre,
    cliente: {
      nombre: nc.facturaOriginal.clienteNombre,
      ruc: nc.facturaOriginal.clienteRuc ?? undefined,
      direccion: nc.facturaOriginal.clienteDireccion ?? undefined,
    },
    items: nc.venta.items.map((item) => ({
      cantidad: Number(item.cantidad),
      descripcion: item.nombreProducto,
      variante: item.nombreVariante ?? undefined,
      precioUnitario: Number(item.precioUnitario),
      total: Number(item.total),
    })),
    totales: {
      subtotal: Number(nc.subtotal),
      descuento: Number(nc.descuento),
      subtotalGravado: Number(nc.subtotalGravado),
      iva: Number(nc.iva),
      subtotalExento: Number(nc.subtotalExento),
      total: Number(nc.total),
    },
    usuario: nc.usuario.nombre,
  }
}

// ============================================
// GENERAR PDF NOTA DE CRÉDITO (BOUCHER)
// ============================================
export async function generarNotaCreditoBoucherPDF(notaCreditoId: string) {
  const datos = await obtenerDatosNotaCredito(notaCreditoId)
  const buffer = await renderToBuffer(<NotaCreditoBoucher datos={datos} />)
  return Buffer.from(buffer).toString('base64')
}

// ============================================
// GENERAR PDF NOTA DE CRÉDITO (A4)
// ============================================
export async function generarNotaCreditoA4PDF(notaCreditoId: string) {
  const datos = await obtenerDatosNotaCredito(notaCreditoId)
  const buffer = await renderToBuffer(<NotaCreditoA4 datos={datos} />)
  return Buffer.from(buffer).toString('base64')
}