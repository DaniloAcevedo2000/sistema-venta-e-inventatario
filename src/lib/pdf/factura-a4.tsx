import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DatosFactura } from './boucher-ticket'

// ============================================
// ESTILOS (para A4 / Media carta)
// ============================================
const styles = StyleSheet.create({
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
    borderBottomColor: '#6B4226',
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
  facturaInfo: {
    alignItems: 'flex-end',
  },
  facturaTitulo: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  facturaNumero: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#6B4226',
    marginBottom: 2,
  },
  facturaMeta: {
    fontSize: 8,
    color: '#666',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  // Info del cliente
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
  clienteItem: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  clienteLabel: {
    color: '#666',
  },
  clienteValor: {
    fontFamily: 'Helvetica-Bold',
  },
  // Tabla de items
  tablaHeader: {
    flexDirection: 'row',
    backgroundColor: '#6B4226',
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
  tablaRowAlt: {
    backgroundColor: '#FAF7F2',
  },
  colCant: {
    width: '10%',
  },
  colDesc: {
    width: '45%',
  },
  colPrecio: {
    width: '15%',
    textAlign: 'right',
  },
  colDescItem: {
    width: '15%',
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    textAlign: 'right',
  },
  itemNombre: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  itemVariante: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  itemNotas: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Totales
  totalesSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalesBox: {
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    fontSize: 10,
  },
  totalLabel: {
    color: '#666',
  },
  totalValor: {
    fontFamily: 'Helvetica-Bold',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#6B4226',
    borderBottomWidth: 2,
    borderBottomColor: '#6B4226',
  },
  totalFinalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#6B4226',
  },
  totalFinalValor: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#6B4226',
  },
  // Pago
  pagoSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FAF7F2',
    borderRadius: 4,
  },
  pagoTitulo: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6B4226',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  pagoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 9,
  },
  // Footer
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

function formatMoney(n: number) {
  return `C$ ${n.toFixed(2)}`
}

// ============================================
// COMPONENTE FACTURA A4
// ============================================
export function FacturaA4({ datos }: { datos: DatosFactura }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <View>
              <Text style={styles.negocioNombre}>
                {datos.negocio.nombreComercial}
              </Text>
              <Text style={styles.negocioInfo}>RUC: {datos.negocio.ruc}</Text>
              <Text style={styles.negocioInfo}>{datos.negocio.direccion}</Text>
              <Text style={styles.negocioInfo}>
                Tel: {datos.negocio.telefono} · {datos.negocio.correo}
              </Text>
            </View>
          </View>

          <View style={styles.facturaInfo}>
            <Text style={styles.facturaTitulo}>{datos.venta.tipoDocumento}</Text>
            <Text style={styles.facturaNumero}>No. {datos.factura.numero}</Text>
            <Text style={styles.facturaMeta}>Fecha: {datos.factura.fecha}</Text>
            {datos.factura.autorizacionDgi && (
              <Text style={styles.facturaMeta}>
                Autorización DGI: {datos.factura.autorizacionDgi}
              </Text>
            )}
          </View>
        </View>

        {/* INFO DEL CLIENTE */}
        <View style={styles.clienteSection}>
          <Text style={styles.clienteTitulo}>Información del Cliente</Text>
          <View style={styles.clienteRow}>
            <View>
              <Text style={styles.clienteItem}>
                <Text style={styles.clienteLabel}>Nombre: </Text>
                <Text style={styles.clienteValor}>{datos.cliente.nombre}</Text>
              </Text>
              {datos.cliente.ruc && (
                <Text style={styles.clienteItem}>
                  <Text style={styles.clienteLabel}>RUC/Cédula: </Text>
                  <Text style={styles.clienteValor}>{datos.cliente.ruc}</Text>
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.clienteItem}>
                <Text style={styles.clienteLabel}>Cajero: </Text>
                <Text style={styles.clienteValor}>{datos.cajero}</Text>
              </Text>
              <Text style={styles.clienteItem}>
                <Text style={styles.clienteLabel}>Sucursal: </Text>
                <Text style={styles.clienteValor}>{datos.sucursal}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* TABLA DE ITEMS */}
        <View style={styles.tablaHeader}>
          <Text style={styles.colCant}>CANT</Text>
          <Text style={styles.colDesc}>DESCRIPCIÓN</Text>
          <Text style={styles.colPrecio}>PRECIO</Text>
          <Text style={styles.colDescItem}>DESC.</Text>
          <Text style={styles.colTotal}>TOTAL</Text>
        </View>

        {datos.items.map((item, index) => (
          <View
            key={index}
            style={[styles.tablaRow, index % 2 === 1 ? styles.tablaRowAlt : {}]}
          >
            <Text style={styles.colCant}>{item.cantidad}</Text>
            <View style={styles.colDesc}>
              <Text style={styles.itemNombre}>{item.descripcion}</Text>
              {item.variante && (
                <Text style={styles.itemVariante}>{item.variante}</Text>
              )}
              {item.notas && (
                <Text style={styles.itemNotas}>Nota: {item.notas}</Text>
              )}
            </View>
            <Text style={styles.colPrecio}>
              {formatMoney(item.precioUnitario)}
            </Text>
            <Text style={styles.colDescItem}>—</Text>
            <Text style={styles.colTotal}>{formatMoney(item.total)}</Text>
          </View>
        ))}

        {/* TOTALES */}
        <View style={styles.totalesSection}>
          <View style={styles.totalesBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValor}>
                {formatMoney(datos.totales.subtotal)}
              </Text>
            </View>

            {datos.totales.descuento > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuento:</Text>
                <Text style={styles.totalValor}>
                  -{formatMoney(datos.totales.descuento)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal Gravado:</Text>
              <Text style={styles.totalValor}>
                {formatMoney(datos.totales.subtotalGravado)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA 15%:</Text>
              <Text style={styles.totalValor}>
                {formatMoney(datos.totales.iva)}
              </Text>
            </View>

            {datos.totales.subtotalExento > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal Exento:</Text>
                <Text style={styles.totalValor}>
                  {formatMoney(datos.totales.subtotalExento)}
                </Text>
              </View>
            )}

            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>TOTAL:</Text>
              <Text style={styles.totalFinalValor}>
                {formatMoney(datos.totales.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* PAGO */}
        <View style={styles.pagoSection}>
          <Text style={styles.pagoTitulo}>Información de Pago</Text>
          <View style={styles.pagoRow}>
            <Text style={styles.totalLabel}>Método de pago:</Text>
            <Text style={styles.totalValor}>{datos.pago.metodo}</Text>
          </View>
          {datos.pago.banco && (
            <View style={styles.pagoRow}>
              <Text style={styles.totalLabel}>Banco:</Text>
              <Text style={styles.totalValor}>{datos.pago.banco}</Text>
            </View>
          )}
          {datos.pago.redTarjeta && (
            <View style={styles.pagoRow}>
              <Text style={styles.totalLabel}>Red de tarjeta:</Text>
              <Text style={styles.totalValor}>{datos.pago.redTarjeta}</Text>
            </View>
          )}
          {datos.pago.referencia && (
            <View style={styles.pagoRow}>
              <Text style={styles.totalLabel}>Referencia:</Text>
              <Text style={styles.totalValor}>{datos.pago.referencia}</Text>
            </View>
          )}
          {datos.pago.montoRecibido > 0 && (
            <View style={styles.pagoRow}>
              <Text style={styles.totalLabel}>Recibido:</Text>
              <Text style={styles.totalValor}>
                {formatMoney(datos.pago.montoRecibido)}
              </Text>
            </View>
          )}
          {datos.pago.cambio > 0 && (
            <View style={styles.pagoRow}>
              <Text style={styles.totalLabel}>Cambio:</Text>
              <Text style={styles.totalValor}>
                {formatMoney(datos.pago.cambio)}
              </Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBold}>¡GRACIAS POR SU PREFERENCIA!</Text>
          <Text>Momoto Café · Síguenos en @momotocafe</Text>
          <Text>Sistema de Ventas e Inventario · v1.0</Text>
        </View>
      </Page>
    </Document>
  )
}