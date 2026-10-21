'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Printer,
  Mail,
  Download,
  Plus,
  FileText,
  Receipt,
  Loader2,
  Maximize2,
  X,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { generarBoucherPDF, generarFacturaA4PDF } from '@/lib/pdf/actions'
import { EnviarFacturaDialog } from '@/components/enviar-factura-dialog'

type VentaCreada = {
  id: string
  numero: string
  facturaNumero: string
  facturaId?: string
  total: number
  cambio: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: VentaCreada | null
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

export function VentaExitosaDialog({ open, onOpenChange, venta }: Props) {
  const [tipoVista, setTipoVista] = React.useState<'boucher' | 'a4'>('boucher')
  const [pdfBoucher, setPdfBoucher] = React.useState<string | null>(null)
  const [pdfA4, setPdfA4] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)

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
    link.download = `${venta?.facturaNumero ?? 'factura'}-${tipo}.pdf`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('PDF descargado')
  }

  const imprimir = () => {
    const base64 = tipoVista === 'boucher' ? pdfBoucher : pdfA4
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
    const win = window.open(url, '_blank')
    win?.focus()
  }

  const verPantallaCompleta = () => {
    const url = tipoVista === 'boucher' ? urlBoucher : urlA4
    if (!url) return
    window.open(url, '_blank')
  }

  if (!venta) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[95vw] w-[95vw] h-[92vh] !p-0 overflow-hidden flex flex-col gap-0"
        showCloseButton={false}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                ¡Venta exitosa!
              </DialogTitle>
              <DialogDescription className="text-xs">
                Venta <span className="font-mono font-medium">{venta.numero}</span>
                {' · '}
                Factura <span className="font-mono font-medium">{venta.facturaNumero}</span>
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total cobrado</p>
              <p className="text-2xl font-bold text-primary leading-tight">
                C$ {venta.total.toFixed(2)}
              </p>
              {venta.cambio > 0 && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Cambio: C$ {venta.cambio.toFixed(2)}
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Columna izquierda */}
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={verPantallaCompleta}
                  disabled={cargando || !urlBoucher}
                >
                  <Maximize2 className="mr-2 h-3.5 w-3.5" />
                  Ver completo
                </Button>
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
                    title="Boucher Térmico"
                  />
                </div>
              ) : tipoVista === 'a4' && urlA4 ? (
                <div className="bg-white rounded-lg shadow-2xl border overflow-hidden w-full max-w-3xl flex-shrink-0">
                  <iframe
                    src={`${urlA4}#toolbar=0&navpanes=0&scrollbar=0`}
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

          {/* Columna derecha */}
          <div className="w-[260px] flex flex-col bg-background border-l flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Acciones
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="default"
                    onClick={imprimir}
                    disabled={cargando || !pdfBoucher}
                    className="w-full justify-start h-11"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => descargarPDF('boucher')}
                    disabled={cargando || !pdfBoucher}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Boucher PDF
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => descargarPDF('a4')}
                    disabled={cargando || !pdfA4}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Factura A4
                  </Button>

                  {/* 👇 AQUI REEMPLAZAMOS EL BOTÓN DE PLACEHOLDER POR EL REAL */}
                  {venta.facturaId && (
                    <EnviarFacturaDialog facturaId={venta.facturaId} />
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Resumen
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venta</span>
                    <span className="font-mono text-xs font-medium">
                      {venta.numero}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Factura</span>
                    <span className="font-mono text-xs font-medium">
                      {venta.facturaNumero}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-primary">
                      C$ {venta.total.toFixed(2)}
                    </span>
                  </div>
                  {venta.cambio > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cambio</span>
                      <span className="font-medium text-green-600">
                        C$ {venta.cambio.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-muted/30">
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-12"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nueva venta
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}