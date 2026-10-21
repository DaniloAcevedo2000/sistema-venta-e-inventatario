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
  Building2,
  AlertCircle,
  Ban,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { generarBoucherPDF, generarFacturaA4PDF } from '@/lib/pdf/actions'
import type { FacturaRow } from './columnas'
import { EnviarFacturaDialog } from '@/components/enviar-factura-dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  factura: FacturaRow | null
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

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export function FacturaDetalleDialog({ open, onOpenChange, factura }: Props) {
  const [tipoVista, setTipoVista] = React.useState<'boucher' | 'a4'>('boucher')
  const [pdfBoucher, setPdfBoucher] = React.useState<string | null>(null)
  const [pdfA4, setPdfA4] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)

  React.useEffect(() => {
    if (!open || !factura?.id) return

    let cancelado = false

    const cargarPDFs = async () => {
      setCargando(true)
      try {
        const [boucher, a4] = await Promise.all([
          generarBoucherPDF(factura.id),
          generarFacturaA4PDF(factura.id),
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
  }, [open, factura?.id])

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

  if (!factura) return null

  const estaAnulada = factura.estado === 'ANULADA'

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
    link.download = `${factura.numeroCompleto}-${tipo}.pdf`
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[95vw] w-[95vw] h-[92vh] !p-0 overflow-hidden flex flex-col gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${
            estaAnulada
              ? 'bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20'
              : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                estaAnulada ? 'bg-red-100 dark:bg-red-950/30' : 'bg-primary/10'
              }`}
            >
              {estaAnulada ? (
                <Ban className="h-6 w-6 text-red-600" />
              ) : (
                <Receipt className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {factura.numeroCompleto}
                {estaAnulada && (
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="h-3 w-3" />
                    ANULADA
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Venta {factura.ventaNumero} · {factura.fecha} · {factura.hora}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p
                className={`text-2xl font-bold leading-tight ${
                  estaAnulada
                    ? 'text-muted-foreground line-through'
                    : 'text-primary'
                }`}
              >
                {formatearMoneda(factura.total)}
              </p>
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

        {/* Contenido */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Vista previa */}
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
                  
                  <EnviarFacturaDialog facturaId={factura.id} />

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

          {/* Info lateral */}
          <div className="w-[300px] flex flex-col bg-background border-l flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Alerta de anulación */}
              {estaAnulada && (
                <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Factura Anulada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {factura.anuladaEn && (
                      <div>
                        <p className="text-muted-foreground">Fecha</p>
                        <p className="font-medium">
                          {new Intl.DateTimeFormat('es-NI', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(factura.anuladaEn))}
                        </p>
                      </div>
                    )}
                    {factura.motivoAnulacion && (
                      <div>
                        <p className="text-muted-foreground">Motivo</p>
                        <p className="italic">"{factura.motivoAnulacion}"</p>
                      </div>
                    )}
                    {factura.tieneNotaCredito && (
                      <div>
                        <p className="text-muted-foreground">Nota de crédito</p>
                        <p className="font-mono font-bold text-blue-700 dark:text-blue-400">
                          {factura.notaCreditoNumero}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Info del cliente */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Cliente
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium">{factura.clienteNombre}</p>
                    </div>
                  </div>
                  {factura.clienteRuc && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          RUC/Cédula
                        </p>
                        <p className="font-mono font-medium">
                          {factura.clienteRuc}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Info de la factura */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Detalles
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Fecha emisión
                      </p>
                      <p className="font-medium">
                        {factura.fecha} · {factura.hora}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sucursal</p>
                      <p className="font-medium">{factura.sucursalNombre}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cajero</p>
                      <p className="font-medium">{factura.cajeroNombre}</p>
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
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatearMoneda(factura.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA 15%</span>
                    <span className="font-medium">
                      {formatearMoneda(factura.iva)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span
                      className={`font-bold ${
                        estaAnulada
                          ? 'text-muted-foreground line-through'
                          : 'text-primary'
                      }`}
                    >
                      {formatearMoneda(factura.total)}
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
      </DialogContent>
    </Dialog>
  )
}