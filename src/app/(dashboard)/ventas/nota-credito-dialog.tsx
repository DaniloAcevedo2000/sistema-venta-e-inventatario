'use client'

import * as React from 'react'
import {
  X,
  Printer,
  Download,
  Loader2,
  Receipt,
  FileText,
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
  generarNotaCreditoBoucherPDF,
  generarNotaCreditoA4PDF,
} from '@/lib/pdf/actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  notaCreditoId: string | null
  numeroNC: string | null
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

export function NotaCreditoDialog({
  open,
  onOpenChange,
  notaCreditoId,
  numeroNC,
}: Props) {
  const [tipoVista, setTipoVista] = React.useState<'boucher' | 'a4'>('boucher')
  const [pdfBoucher, setPdfBoucher] = React.useState<string | null>(null)
  const [pdfA4, setPdfA4] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)

  React.useEffect(() => {
    if (!open || !notaCreditoId) return

    let cancelado = false

    const cargarPDFs = async () => {
      setCargando(true)
      try {
        const [boucher, a4] = await Promise.all([
          generarNotaCreditoBoucherPDF(notaCreditoId),
          generarNotaCreditoA4PDF(notaCreditoId),
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
  }, [open, notaCreditoId])

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
    link.download = `${numeroNC ?? 'nota-credito'}-${tipo}.pdf`
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
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Nota de Crédito
              </DialogTitle>
              <DialogDescription className="text-xs">
                <span className="font-mono font-medium">
                  {numeroNC ?? '—'}
                </span>
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Documento fiscal
            </Badge>
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
                      Nota A4
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
                    title="Nota de Crédito Boucher"
                  />
                </div>
              ) : tipoVista === 'a4' && urlA4 ? (
                <div className="bg-white rounded-lg shadow-2xl border overflow-hidden w-full max-w-3xl flex-shrink-0">
                  <iframe
                    src={`${urlA4}#toolbar=0&navpanes=0`}
                    className="w-full h-[750px] block"
                    title="Nota de Crédito A4"
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
          <div className="w-[280px] flex flex-col bg-background border-l flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Información
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Número NC</p>
                    <p className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {numeroNC ?? '—'}
                    </p>
                  </div>

                  <Separator />

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Esta nota de crédito fue emitida para respaldar la anulación
                    de una venta. Es un documento fiscal que reduce el monto de
                    la factura original.
                  </p>
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