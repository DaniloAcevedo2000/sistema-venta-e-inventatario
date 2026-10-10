import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ============================================
// TIPOS
// ============================================
export type DatosNotaCredito = {
  negocio: {
    nombreComercial: string
    nombreLegal: string
    ruc: string
    direccion: string
    telefono: string
    correo: string
  }
  notaCredito: {
    numero: string
    fecha: string
    motivo: string
  }
  facturaOriginal: {
    numero: string
    fecha: string
  }
  venta: {
    numero: string
  }
  cajero: string
  sucursal: string
  cliente: {
    nombre: string
    ruc?: string
    direccion?: string
  }
  items: Array<{
    cantidad: number
    descripcion: string
    variante?: string
    precioUnitario: number
    total: number
  }>
  totales: {
    subtotal: number
    descuento: number
    subtotalGravado: number
    iva: number
    subtotalExento: number
    total: number
  }
  usuario: string
}

// ============================================
// ESTILOS BOUCHER
// ============================================
const boucherStyles = StyleSheet.create({
  page: {
    width: 226,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#000',
  },
  center: { textAlign: 'center' },
  bold: { fontFamily: 'Courier-Bold' },
  titulo: {
    fontSize: 12,
    fontFamily: 'Courier-Bold',
    textAlign: 'center',
    marginBottom: 2,
    color: '#000',
  },
  subtitulo: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 1,
  },
  avisoNC: {
    marginVertical: 4,
    padding: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  avisoNCText: {
    fontSize: 10,
    fontFamily: 'Courier-Bold',
    textAlign: 'center',
  },
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
  itemRow: { flexDirection: 'row', marginBottom: 1 },
  itemCant: { width: 20 },
  itemDesc: { flex: 1 },
  itemPrecio: { width: 45, textAlign: 'right' },
  itemTotal: { width: 50, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalLabel: { fontFamily: 'Courier' },
  totalValor: { fontFamily: 'Courier-Bold' },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  totalFinalLabel: { fontSize: 12, fontFamily: 'Courier-Bold' },
  totalFinalValor: { fontSize: 12, fontFamily: 'Courier-Bold' },
  footer: { fontSize: 7, textAlign: 'center', marginTop: 2 },
  small: { fontSize: 7 },
})

// ============================================
// ESTILOS A4
// ============================================
const a4Styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#dc2626',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 50,
    height: 50,
    backgroundColor: '#6B4226',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
  },
  negocioNombre: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#6B4226',
    marginBottom: 2,
  },
  negocioInfo: {
    fontSize: 8,
    color: '#666',
    lineHeight: 1.4,
  },
  documentoInfo: { alignItems: 'flex-end' },
  documentoTitulo: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  documentoNumero: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    marginBottom: 2,
  },
  documentoMeta: {
    fontSize: 8,
    color: '#666',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  avisoBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  avisoTitulo: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  avisoTexto: {
    fontSize: 9,
    color: '#991b1b',
    lineHeight: 1.5,
  },
  clienteSection: {
    backgroundColor: '#FAF7F2',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  clienteTitulo: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6B4226',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  clienteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clienteItem: { fontSize: 9, lineHeight: 1.5 },
  clienteLabel: { color: '#666' },
  clienteValor: { fontFamily: 'Helvetica-Bold' },
  tablaHeader: {
    flexDirection: 'row',
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 1,
  },
  tablaRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E0D8',
  },
  tablaRowAlt: { backgroundColor: '#FAF7F2' },
  colCant: { width: '10%' },
  colDesc: { width: '50%' },
  colPrecio: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  itemNombre: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  itemVariante: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  totalesSection: { marginTop: 20, alignItems: 'flex-end' },
  totalesBox: { width: '50%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    fontSize: 10,
  },
  totalLabel: { color: '#666' },
  totalValor: { fontFamily: 'Helvetica-Bold' },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#dc2626',
    borderBottomWidth: 2,
    borderBottomColor: '#dc2626',
  },
  totalFinalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  totalFinalValor: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: '#E8E0D8',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
  footerBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#6B4226',
    marginBottom: 2,
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

// ============================================
// BOUCHER NOTA DE CRÉDITO
// ============================================
export function NotaCreditoBoucher({ datos }: { datos: DatosNotaCredito }) {
  return (
    <Document>
      <Page size={[226, 800]} style={boucherStyles.page} wrap>
        <Text style={boucherStyles.titulo}>
          {datos.negocio.nombreComercial.toUpperCase()}
        </Text>
        <Text style={boucherStyles.subtitulo}>Sistema de Ventas e Inventario</Text>

        <View style={boucherStyles.lineDouble} />

        <Text style={boucherStyles.subtitulo}>RUC: {datos.negocio.ruc}</Text>
        <Text style={boucherStyles.subtitulo}>{datos.negocio.direccion}</Text>
        <Text style={boucherStyles.subtitulo}>Tel: {datos.negocio.telefono}</Text>
        <Text style={boucherStyles.subtitulo}>{datos.negocio.correo}</Text>

        <View style={boucherStyles.lineDouble} />

        <Text style={[boucherStyles.center, boucherStyles.bold, { fontSize: 10 }]}>
          NOTA DE CRÉDITO
        </Text>
        <Text style={[boucherStyles.center, boucherStyles.bold, { fontSize: 10 }]}>
          No. {datos.notaCredito.numero}
        </Text>

        <View style={boucherStyles.lineDashed} />

        <Text style={boucherStyles.small}>Fecha: {datos.notaCredito.fecha}</Text>
        <Text style={boucherStyles.small}>Cajero: {datos.cajero}</Text>
        <Text style={boucherStyles.small}>Sucursal: {datos.sucursal}</Text>

        <View style={boucherStyles.lineDashed} />

        <Text style={boucherStyles.small}>
          Factura original: {datos.facturaOriginal.numero}
        </Text>
        <Text style={boucherStyles.small}>
          Fecha factura: {datos.facturaOriginal.fecha}
        </Text>
        <Text style={boucherStyles.small}>Venta: {datos.venta.numero}</Text>

        <View style={boucherStyles.lineDashed} />

        <Text style={boucherStyles.small}>Cliente: {datos.cliente.nombre}</Text>
        {datos.cliente.ruc && (
          <Text style={boucherStyles.small}>RUC/Cédula: {datos.cliente.ruc}</Text>
        )}

        <View style={boucherStyles.lineSingle} />

        <Text style={boucherStyles.small}>MOTIVO DE LA NOTA:</Text>
        <Text style={[boucherStyles.small, boucherStyles.bold, { marginTop: 2 }]}>
          {datos.notaCredito.motivo}
        </Text>

        <View style={boucherStyles.lineSingle} />

        {/* Items */}
        <View style={boucherStyles.itemRow}>
          <Text style={[boucherStyles.itemCant, boucherStyles.bold]}>CANT</Text>
          <Text style={[boucherStyles.itemDesc, boucherStyles.bold]}>
            DESCRIPCIÓN
          </Text>
          <Text style={[boucherStyles.itemPrecio, boucherStyles.bold]}>
            PRECIO
          </Text>
          <Text style={[boucherStyles.itemTotal, boucherStyles.bold]}>TOTAL</Text>
        </View>

        <View style={boucherStyles.lineSingle} />

        {datos.items.map((item, index) => (
          <View key={index} style={boucherStyles.itemRow}>
            <Text style={boucherStyles.itemCant}>{item.cantidad}</Text>
            <Text style={boucherStyles.itemDesc}>
              {item.descripcion}
              {item.variante ? ` - ${item.variante}` : ''}
            </Text>
            <Text style={boucherStyles.itemPrecio}>
              {formatNumber(item.precioUnitario)}
            </Text>
            <Text style={boucherStyles.itemTotal}>{formatNumber(item.total)}</Text>
          </View>
        ))}

        <View style={boucherStyles.lineSingle} />

        {/* Totales */}
        <View style={boucherStyles.totalRow}>
          <Text style={boucherStyles.totalLabel}>SUBTOTAL:</Text>
          <Text style={boucherStyles.totalValor}>
            {formatMoney(datos.totales.subtotal)}
          </Text>
        </View>

        {datos.totales.descuento > 0 && (
          <View style={boucherStyles.totalRow}>
            <Text style={boucherStyles.totalLabel}>DESCUENTO:</Text>
            <Text style={boucherStyles.totalValor}>
              -{formatMoney(datos.totales.descuento)}
            </Text>
          </View>
        )}

        <View style={boucherStyles.totalRow}>
          <Text style={boucherStyles.totalLabel}>SUBTOTAL GRAVADO:</Text>
          <Text style={boucherStyles.totalValor}>
            {formatMoney(datos.totales.subtotalGravado)}
          </Text>
        </View>

        <View style={boucherStyles.totalRow}>
          <Text style={boucherStyles.totalLabel}>IVA 15%:</Text>
          <Text style={boucherStyles.totalValor}>
            {formatMoney(datos.totales.iva)}
          </Text>
        </View>

        <View style={boucherStyles.totalFinal}>
          <Text style={boucherStyles.totalFinalLabel}>TOTAL NC:</Text>
          <Text style={boucherStyles.totalFinalValor}>
            {formatMoney(datos.totales.total)}
          </Text>
        </View>

        <View style={boucherStyles.lineDouble} />

        <Text style={[boucherStyles.footer, boucherStyles.bold]}>
          DOCUMENTO DE NOTA DE CRÉDITO
        </Text>
        <Text style={boucherStyles.footer}>
          Emitida por: {datos.usuario}
        </Text>

        <View style={boucherStyles.lineSingle} />

        <Text style={boucherStyles.footer}>
          Sistema: Momoto Café v1.0
        </Text>

        <View style={boucherStyles.lineDouble} />
      </Page>
    </Document>
  )
}

// ============================================
// A4 NOTA DE CRÉDITO
// ============================================
export function NotaCreditoA4({ datos }: { datos: DatosNotaCredito }) {
  return (
    <Document>
      <Page size="A4" style={a4Styles.page}>
        {/* HEADER */}
        <View style={a4Styles.header}>
          <View style={a4Styles.logoSection}>
            <View style={a4Styles.logo}>
              <Text style={a4Styles.logoText}>M</Text>
            </View>
            <View>
              <Text style={a4Styles.negocioNombre}>
                {datos.negocio.nombreComercial}
              </Text>
              <Text style={a4Styles.negocioInfo}>RUC: {datos.negocio.ruc}</Text>
              <Text style={a4Styles.negocioInfo}>
                {datos.negocio.direccion}
              </Text>
              <Text style={a4Styles.negocioInfo}>
                Tel: {datos.negocio.telefono} · {datos.negocio.correo}
              </Text>
            </View>
          </View>

          <View style={a4Styles.documentoInfo}>
            <Text style={a4Styles.documentoTitulo}>NOTA DE CRÉDITO</Text>
            <Text style={a4Styles.documentoNumero}>
              No. {datos.notaCredito.numero}
            </Text>
            <Text style={a4Styles.documentoMeta}>
              Fecha: {datos.notaCredito.fecha}
            </Text>
          </View>
        </View>

        {/* AVISO */}
        <View style={a4Styles.avisoBox}>
          <Text style={a4Styles.avisoTitulo}>
            DOCUMENTO DE NOTA DE CRÉDITO
          </Text>
          <Text style={a4Styles.avisoTexto}>
            Esta nota de crédito reduce el monto de la factura{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {datos.facturaOriginal.numero}
            </Text>{' '}
            emitida el {datos.facturaOriginal.fecha}. Se emite para respaldar la
            anulación de la venta {datos.venta.numero}.
          </Text>
        </View>

        {/* INFO DEL CLIENTE */}
        <View style={a4Styles.clienteSection}>
          <Text style={a4Styles.clienteTitulo}>Información del Cliente</Text>
          <View style={a4Styles.clienteRow}>
            <View>
              <Text style={a4Styles.clienteItem}>
                <Text style={a4Styles.clienteLabel}>Nombre: </Text>
                <Text style={a4Styles.clienteValor}>{datos.cliente.nombre}</Text>
              </Text>
              {datos.cliente.ruc && (
                <Text style={a4Styles.clienteItem}>
                  <Text style={a4Styles.clienteLabel}>RUC/Cédula: </Text>
                  <Text style={a4Styles.clienteValor}>{datos.cliente.ruc}</Text>
                </Text>
              )}
            </View>
            <View>
              <Text style={a4Styles.clienteItem}>
                <Text style={a4Styles.clienteLabel}>Cajero: </Text>
                <Text style={a4Styles.clienteValor}>{datos.cajero}</Text>
              </Text>
              <Text style={a4Styles.clienteItem}>
                <Text style={a4Styles.clienteLabel}>Sucursal: </Text>
                <Text style={a4Styles.clienteValor}>{datos.sucursal}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* MOTIVO */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>
            MOTIVO:
          </Text>
          <Text style={{ fontSize: 10, fontStyle: 'italic' }}>
            {datos.notaCredito.motivo}
          </Text>
        </View>

        {/* TABLA DE ITEMS */}
        <View style={a4Styles.tablaHeader}>
          <Text style={a4Styles.colCant}>CANT</Text>
          <Text style={a4Styles.colDesc}>DESCRIPCIÓN</Text>
          <Text style={a4Styles.colPrecio}>PRECIO</Text>
          <Text style={a4Styles.colTotal}>TOTAL</Text>
        </View>

        {datos.items.map((item, index) => (
          <View
            key={index}
            style={[a4Styles.tablaRow, index % 2 === 1 ? a4Styles.tablaRowAlt : {}]}
          >
            <Text style={a4Styles.colCant}>{item.cantidad}</Text>
            <View style={a4Styles.colDesc}>
              <Text style={a4Styles.itemNombre}>{item.descripcion}</Text>
              {item.variante && (
                <Text style={a4Styles.itemVariante}>{item.variante}</Text>
              )}
            </View>
            <Text style={a4Styles.colPrecio}>
              {formatMoney(item.precioUnitario)}
            </Text>
            <Text style={a4Styles.colTotal}>{formatMoney(item.total)}</Text>
          </View>
        ))}

        {/* TOTALES */}
        <View style={a4Styles.totalesSection}>
          <View style={a4Styles.totalesBox}>
            <View style={a4Styles.totalRow}>
              <Text style={a4Styles.totalLabel}>Subtotal:</Text>
              <Text style={a4Styles.totalValor}>
                {formatMoney(datos.totales.subtotal)}
              </Text>
            </View>

            {datos.totales.descuento > 0 && (
              <View style={a4Styles.totalRow}>
                <Text style={a4Styles.totalLabel}>Descuento:</Text>
                <Text style={a4Styles.totalValor}>
                  -{formatMoney(datos.totales.descuento)}
                </Text>
              </View>
            )}

            <View style={a4Styles.totalRow}>
              <Text style={a4Styles.totalLabel}>Subtotal Gravado:</Text>
              <Text style={a4Styles.totalValor}>
                {formatMoney(datos.totales.subtotalGravado)}
              </Text>
            </View>

            <View style={a4Styles.totalRow}>
              <Text style={a4Styles.totalLabel}>IVA 15%:</Text>
              <Text style={a4Styles.totalValor}>
                {formatMoney(datos.totales.iva)}
              </Text>
            </View>

            <View style={a4Styles.totalFinalRow}>
              <Text style={a4Styles.totalFinalLabel}>TOTAL NC:</Text>
              <Text style={a4Styles.totalFinalValor}>
                {formatMoney(datos.totales.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* FIRMA */}
        <View style={{ marginTop: 60, alignItems: 'center' }}>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#666',
              width: 200,
              paddingTop: 4,
            }}
          >
            <Text style={{ fontSize: 9, textAlign: 'center', color: '#666' }}>
              {datos.usuario}
            </Text>
            <Text style={{ fontSize: 8, textAlign: 'center', color: '#999' }}>
              Emitió la nota de crédito
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={a4Styles.footer} fixed>
          <Text style={a4Styles.footerBold}>
            DOCUMENTO DE NOTA DE CRÉDITO
          </Text>
          <Text>Momoto Café · Sistema de Ventas e Inventario · v1.0</Text>
        </View>
      </Page>
    </Document>
  )
}