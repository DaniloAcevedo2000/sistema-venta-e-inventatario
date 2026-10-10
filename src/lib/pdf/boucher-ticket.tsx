import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// ============================================
// TIPOS
// ============================================
export type DatosFactura = {
  // Negocio
  negocio: {
    nombreComercial: string
    nombreLegal: string
    ruc: string
    direccion: string
    telefono: string
    correo: string
  }
  // Factura
  factura: {
    numero: string
    serie: string
    fecha: string
    autorizacionDgi?: string
  }
  // Venta
  venta: {
    numero: string
    tipoDocumento: string
  }
  // Cajero y sucursal
  cajero: string
  caja?: string
  sucursal: string
  // Cliente
  cliente: {
    nombre: string
    ruc?: string
    direccion?: string
  }
  // Items
  items: Array<{
    cantidad: number
    descripcion: string
    variante?: string
    notas?: string
    precioUnitario: number
    total: number
  }>
  // Totales
  totales: {
    subtotal: number
    descuento: number
    subtotalGravado: number
    iva: number
    subtotalExento: number
    total: number
  }
  // Pago
  pago: {
    metodo: string
    montoRecibido: number
    cambio: number
    referencia?: string
    banco?: string
    redTarjeta?: string
  }
}

// ============================================
// ESTILOS (para ancho 80mm ≈ 226pt)
// ============================================
const styles = StyleSheet.create({
  page: {
    width: 226, // 80mm en puntos
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#000',
  },
  center: {
    textAlign: 'center',
  },
  bold: {
    fontFamily: 'Courier-Bold',
  },
  // Líneas separadoras
  lineDouble: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 3,
    marginVertical: 4,
  },
  lineSingle: {
    borderTopWidth: 0.5,
    borderTopColor: '#000',
    marginVertical: 4,
  },
  lineDashed: {
    borderTopWidth: 0.5,
    borderTopColor: '#000',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  // Header
  titulo: {
    fontSize: 14,
    fontFamily: 'Courier-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitulo: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 1,
  },
  // Items
  itemRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  itemCant: {
    width: 20,
  },
  itemDesc: {
    flex: 1,
  },
  itemPrecio: {
    width: 45,
    textAlign: 'right',
  },
  itemTotal: {
    width: 50,
    textAlign: 'right',
  },
  // Notas
  notaItem: {
    fontSize: 7,
    fontStyle: 'italic',
    paddingLeft: 20,
    color: '#333',
  },
  // Totales
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalLabel: {
    fontFamily: 'Courier',
  },
  totalValor: {
    fontFamily: 'Courier-Bold',
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  totalFinalLabel: {
    fontSize: 12,
    fontFamily: 'Courier-Bold',
  },
  totalFinalValor: {
    fontSize: 12,
    fontFamily: 'Courier-Bold',
  },
  // Footer
  footer: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 2,
  },
  // Texto pequeño
  small: {
    fontSize: 7,
  },
})

// ============================================
// HELPERS
// ============================================
function formatMoney(n: number) {
  return `C$ ${n.toFixed(2)}`
}

function formatNumber(n: number) {
  return n.toFixed(2)
}

function repeatChar(char: string, count: number) {
  return char.repeat(count)
}

// ============================================
// COMPONENTE BOUCHER
// ============================================
export function BoucherTicket({ datos }: { datos: DatosFactura }) {
  return (
    <Document>
      <Page size={[226, 800]} style={styles.page} wrap>
        {/* HEADER - Datos del negocio */}
        <Text style={styles.titulo}>{datos.negocio.nombreComercial.toUpperCase()}</Text>
        <Text style={styles.subtitulo}>Sistema de Ventas e Inventario</Text>

        <View style={styles.lineDouble} />

        <Text style={styles.subtitulo}>RUC: {datos.negocio.ruc}</Text>
        <Text style={styles.subtitulo}>{datos.negocio.direccion}</Text>
        <Text style={styles.subtitulo}>Tel: {datos.negocio.telefono}</Text>
        <Text style={styles.subtitulo}>{datos.negocio.correo}</Text>

        <View style={styles.lineDouble} />

        {/* Número de factura */}
        <Text style={[styles.center, styles.bold, { fontSize: 10 }]}>
          {datos.venta.tipoDocumento} No. {datos.factura.numero}
        </Text>

        <View style={styles.lineDashed} />

        {/* Datos de la venta */}
        <Text style={styles.small}>Fecha: {datos.factura.fecha}</Text>
        <Text style={styles.small}>Cajero: {datos.cajero}</Text>
        {datos.caja && <Text style={styles.small}>Caja: {datos.caja}</Text>}
        <Text style={styles.small}>Sucursal: {datos.sucursal}</Text>

        <View style={styles.lineDashed} />

        {/* Cliente */}
        <Text style={styles.small}>Cliente: {datos.cliente.nombre}</Text>
        {datos.cliente.ruc && (
          <Text style={styles.small}>RUC/Cédula: {datos.cliente.ruc}</Text>
        )}
        {datos.cliente.direccion && (
          <Text style={styles.small}>Dirección: {datos.cliente.direccion}</Text>
        )}

        <View style={styles.lineSingle} />

        {/* Header de items */}
        <View style={styles.itemRow}>
          <Text style={[styles.itemCant, styles.bold]}>CANT</Text>
          <Text style={[styles.itemDesc, styles.bold]}>DESCRIPCIÓN</Text>
          <Text style={[styles.itemPrecio, styles.bold]}>PRECIO</Text>
          <Text style={[styles.itemTotal, styles.bold]}>TOTAL</Text>
        </View>

        <View style={styles.lineSingle} />

        {/* Items */}
        {datos.items.map((item, index) => (
          <View key={index}>
            <View style={styles.itemRow}>
              <Text style={styles.itemCant}>{item.cantidad}</Text>
              <Text style={styles.itemDesc}>
                {item.descripcion}
                {item.variante ? ` - ${item.variante}` : ''}
              </Text>
              <Text style={styles.itemPrecio}>
                {formatNumber(item.precioUnitario)}
              </Text>
              <Text style={styles.itemTotal}>{formatNumber(item.total)}</Text>
            </View>
            {item.notas && (
              <Text style={styles.notaItem}>└ {item.notas}</Text>
            )}
          </View>
        ))}

        <View style={styles.lineSingle} />

        {/* Totales */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>SUBTOTAL:</Text>
          <Text style={styles.totalValor}>{formatMoney(datos.totales.subtotal)}</Text>
        </View>

        {datos.totales.descuento > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>DESCUENTO:</Text>
            <Text style={styles.totalValor}>
              -{formatMoney(datos.totales.descuento)}
            </Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>SUBTOTAL GRAVADO:</Text>
          <Text style={styles.totalValor}>
            {formatMoney(datos.totales.subtotalGravado)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA 15%:</Text>
          <Text style={styles.totalValor}>{formatMoney(datos.totales.iva)}</Text>
        </View>

        {datos.totales.subtotalExento > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SUBTOTAL EXENTO:</Text>
            <Text style={styles.totalValor}>
              {formatMoney(datos.totales.subtotalExento)}
            </Text>
          </View>
        )}

        {/* TOTAL destacado */}
        <View style={styles.totalFinal}>
          <Text style={styles.totalFinalLabel}>TOTAL:</Text>
          <Text style={styles.totalFinalValor}>
            {formatMoney(datos.totales.total)}
          </Text>
        </View>

        {/* Pago */}
        <Text style={styles.small}>PAGO CON: {datos.pago.metodo}</Text>
        {datos.pago.banco && (
          <Text style={styles.small}>Banco: {datos.pago.banco}</Text>
        )}
        {datos.pago.redTarjeta && (
          <Text style={styles.small}>Red: {datos.pago.redTarjeta}</Text>
        )}
        {datos.pago.referencia && (
          <Text style={styles.small}>Ref: {datos.pago.referencia}</Text>
        )}
        {datos.pago.montoRecibido > 0 && (
          <Text style={styles.small}>
            Recibido: {formatMoney(datos.pago.montoRecibido)}
          </Text>
        )}
        {datos.pago.cambio > 0 && (
          <Text style={[styles.small, styles.bold]}>
            Cambio: {formatMoney(datos.pago.cambio)}
          </Text>
        )}

        <View style={styles.lineDouble} />

        {/* Footer */}
        <Text style={[styles.footer, styles.bold]}>
          ¡GRACIAS POR SU PREFERENCIA!
        </Text>
        <Text style={styles.footer}>Síguenos en @momotocafe</Text>

        <View style={styles.lineSingle} />

        {datos.factura.autorizacionDgi && (
          <Text style={styles.footer}>
            Autorización DGI: {datos.factura.autorizacionDgi}
          </Text>
        )}
        <Text style={styles.footer}>Sistema: Momoto Café v1.0</Text>

        <View style={styles.lineDouble} />
      </Page>
    </Document>
  )
}