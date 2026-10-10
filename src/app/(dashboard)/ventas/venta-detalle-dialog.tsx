'use client'

import * as React from 'react'
import {
  X,
  Printer,
  Download,
  Loader2,
  Receipt,
  FileText,
  User,
  Calendar,
  CreditCard,
  Store,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  DollarSign,
  Building2,
  Wallet,
  Ban,
  RotateCcw,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generarBoucherPDF, generarFacturaA4PDF } from '@/lib/pdf/actions'
import type { VentaRow } from './columnas'
import { NotaCreditoDialog } from './nota-credito-dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: VentaRow | null
}

function base64ToBlobUrl(base64: string) {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: 'application/pdf',
  })
  return URL.createObjectURL(blob)
}

function formatearFecha(fechaISO: string) {
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fechaISO))
}

const LABELS_METODO_DEVOLUCION: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia bancaria',
  TARJETA: 'Reverso en tarjeta',
  SALDO_A_FAVOR: 'Saldo a favor',
}

export function VentaDetalleDialog({ open, onOpenChange, venta }: Props) {
  const [tipoVista, setTipoVista] = React.useState<'boucher' | 'a4'>('boucher')
  const [pdfBoucher, setPdfBoucher] = React.useState<string | null>(null)
  const [pdfA4, setPdfA4] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)
  const [ncOpen, setNcOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open || !venta?.facturaId) return

    let cancelado = false

    const cargarPDFs = async () => {
      setCargando(true)
      try {
        const [boucher, a4] = await Promise.all([
          generarBoucherPDF(venta.facturaId!),
          generarFacturaA4PDF(venta.facturaId!),
        ])
        if (!cancelado) {
          setPdfBoucher(boucher)
          setPdfA4(a4)
        }
      } catch (error) {
        console.error(error)
        if (!cancelado) toast.error('Error al generar la vista previa')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargarPDFs()

    return () => {
      cancelado = true
    }
  }, [open, venta?.facturaId])

  React.useEffect(() => {
    if (!open) {
      setPdfBoucher(null)
      setPdfA4(null)
      setTipoVista('boucher')
    }
  }, [open])

  const urlBoucher = React.useMemo(
    () => (pdfBoucher ? base64ToBlobUrl(pdfBoucher) : null),
    [pdfBoucher]
  )
  const urlA4 = React.useMemo(
    () => (pdfA4 ? base64ToBlobUrl(pdfA4) : null),
    [pdfA4]
  )

  if (!venta) return null

  const descargarPDF = (tipo: 'boucher' | 'a4') => {
    const base64 = tipo === 'boucher' ? pdfBoucher : pdfA4
    if (!base64) return

    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: 'application/pdf',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${venta.facturaNumero ?? venta.numero}-${tipo}.pdf`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('PDF descargado')
  }

  const imprimir = () => {
    const url = tipoVista === 'boucher' ? urlBoucher : urlA4
    if (!url) return
    const win = window.open(url, '_blank')
    win?.focus()
  }

  const estaAnulada = venta.estado === 'ANULADA'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[95vw] w-[95vw] h-[92vh] !p-0 overflow-hidden flex flex-col gap-0"
        showCloseButton={false}
      >
        {/* ============================================
            HEADER
            ============================================ */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${
            estaAnulada
              ? 'bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20'
              : 'bg-background'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                estaAnulada ? 'bg-red-100 dark:bg-red-950/30' : 'bg-primary/10'
              }`}
            >
              {estaAnulada ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : (
                <Receipt className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {venta.numero}
                {estaAnulada && (
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="h-3 w-3" />
                    ANULADA
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Factura{' '}
                <span className="font-mono font-medium">
                  {venta.facturaNumero ?? 'Sin factura'}
                </span>
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {estaAnulada ? 'Total devuelto' : 'Total'}
              </p>
              <p
                className={`text-2xl font-bold leading-tight ${
                  estaAnulada ? 'text-red-600 line-through' : 'text-primary'
                }`}
              >
                C$ {venta.total.toFixed(2)}
              </p>
              {estaAnulada && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Devuelto: C$ {(venta.montoDevuelto ?? 0).toFixed(2)}
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ============================================
            CONTENIDO
            ============================================ */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Columna izquierda: Vista previa */}
          <div className="flex-1 flex flex-col bg-muted/40 min-w-0">
            <div className="px-4 py-3 border-b bg-background flex-shrink-0">
              <div className="flex items-center justify-between">
                <Tabs
                  value={tipoVista}
                  onValueChange={(v) => setTipoVista(v as any)}
                >
                  <TabsList>
                    <TabsTrigger value="boucher" className="gap-2">
                      <Receipt className="h-4 w-4" />
                      Boucher Térmico
                    </TabsTrigger>
                    <TabsTrigger value="a4" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Factura A4
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={imprimir}
                    disabled={cargando}
                  >
                    <Printer className="mr-2 h-3.5 w-3.5" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => descargarPDF(tipoVista)}
                    disabled={cargando}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 flex justify-center items-start min-h-0">
              {cargando ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin mb-3" />
                  <p className="text-sm">Generando vista previa...</p>
                </div>
              ) : tipoVista === 'boucher' && urlBoucher ? (
                <div className="bg-white rounded-lg shadow-2xl border overflow-hidden flex-shrink-0">
                  <iframe
                    src={urlBoucher}
                    className="w-[280px] h-[700px] block"
                    title="Boucher"
                  />
                </div>
              ) : tipoVista === 'a4' && urlA4 ? (
                <div className="bg-white rounded-lg shadow-2xl border overflow-hidden w-full max-w-3xl flex-shrink-0">
                  <iframe
                    src={`${urlA4}#toolbar=0&navpanes=0`}
                    className="w-full h-[750px] block"
                    title="Factura A4"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No hay vista previa disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Info detallada */}
          <div className="w-[340px] flex flex-col bg-background border-l flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* ============================================
                  SECCIÓN DE ANULACIÓN (solo si aplica)
                  ============================================ */}
              {estaAnulada && (
                <>
                  <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Información de Anulación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Anulada por</p>
                        <p className="font-medium">
                          {venta.anuladaPorNombre ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha de anulación</p>
                        <p className="font-medium">
                          {venta.anuladaEn
                            ? formatearFecha(venta.anuladaEn)
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Motivo</p>
                        <p className="font-medium italic">
                          "{venta.motivoAnulacion ?? '—'}"
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-muted-foreground">
                          Devolución del dinero
                        </p>
                        <p className="font-medium">
                          {LABELS_METODO_DEVOLUCION[
                            venta.metodoDevolucion ?? ''
                          ] ?? '—'}
                        </p>
                        <p className="font-bold text-red-600 mt-1">
                          C$ {(venta.montoDevuelto ?? 0).toFixed(2)}
                        </p>
                      </div>

                      {venta.devueltaAlInventario && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">
                              Devuelto al inventario
                            </p>
                            <p className="text-muted-foreground">
                              {venta.movimientosAnulacion.length} movimiento(s)
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Movimientos de inventario */}
                  {venta.devueltaAlInventario &&
                    venta.movimientosAnulacion.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-green-600" />
                            Insumos devueltos
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {venta.movimientosAnulacion.map((mov) => (
                            <div
                              key={mov.id}
                              className="flex items-center justify-between text-xs border-b pb-1.5 last:border-0"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {mov.insumoNombre ?? mov.productoNombre}
                                </p>
                                <p className="text-muted-foreground font-mono text-[10px]">
                                  {mov.insumoCodigo ?? mov.productoCodigo}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/20"
                              >
                                +{mov.cantidad.toFixed(2)}
                                {mov.unidadAbreviatura
                                  ? ` ${mov.unidadAbreviatura}`
                                  : ''}
                              </Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                  {/* Nota de crédito */}
                  {venta.notaCreditoNumero && (
                    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Nota de Crédito
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Número</p>
                          <p className="font-mono font-bold text-blue-700 dark:text-blue-400">
                            {venta.notaCreditoNumero}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monto</p>
                          <p className="font-medium">
                            C$ {(venta.notaCreditoTotal ?? 0).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setNcOpen(true)}
                        >
                          <FileText className="mr-2 h-3.5 w-3.5" />
                          Ver nota de crédito
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Separator />
                </>
              )}

              {/* ============================================
                  INFO DE LA VENTA
                  ============================================ */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Información de la Venta
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="font-medium">
                        {venta.fecha} · {venta.hora}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="font-medium">{venta.clienteNombre}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Registrada por
                      </p>
                      <p className="font-medium">{venta.cajeroNombre}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Store className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sucursal</p>
                      <p className="font-medium">{venta.sucursalNombre}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Método de pago
                      </p>
                      <p className="font-medium">{venta.metodoPago}</p>
                      {venta.banco && (
                        <p className="text-xs text-muted-foreground">
                          {venta.banco}
                          {venta.redTarjeta ? ` · ${venta.redTarjeta}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Totales */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Totales
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{venta.cantidadItems}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">
                      {estaAnulada ? 'Total original' : 'Total'}
                    </span>
                    <span
                      className={`font-bold ${
                        estaAnulada
                          ? 'text-red-600 line-through'
                          : 'text-primary'
                      }`}
                    >
                      C$ {venta.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-muted/30">
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full"
                variant="outline"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
        
        <NotaCreditoDialog
          open={ncOpen}
          onOpenChange={setNcOpen}
          notaCreditoId={venta.notaCreditoId}
          numeroNC={venta.notaCreditoNumero}
        />

      </DialogContent>
    </Dialog>
  )
}