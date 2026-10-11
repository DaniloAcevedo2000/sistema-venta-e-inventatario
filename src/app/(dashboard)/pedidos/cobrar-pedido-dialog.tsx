'use client'

import * as React from 'react'
import * as Icons from 'lucide-react'
import { toast } from 'sonner'
import {
  Loader2,
  DollarSign,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cobrarPedidoAction } from './actions'

type MetodoPago = {
  id: string
  codigo: string
  nombre: string
  tipo: string
  requiereBanco: boolean
  requiereRed: boolean
  requiereReferencia: boolean
  esCredito: boolean
  icono: string | null
}

type Banco = {
  id: string
  nombre: string
}

type RedTarjeta = {
  id: string
  nombre: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: {
    id: string
    numero: string
    total: number
    clienteNombre: string
    clienteId: string | null
  } | null
  metodosPago: MetodoPago[]
  bancos: Banco[]
  redesTarjeta: RedTarjeta[]
  onSuccess?: (resultado: any) => void
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export function CobrarPedidoDialog({
  open,
  onOpenChange,
  pedido,
  metodosPago,
  bancos,
  redesTarjeta,
  onSuccess,
}: Props) {
  const [metodoId, setMetodoId] = React.useState('')
  const [montoRecibido, setMontoRecibido] = React.useState('')
  const [bancoId, setBancoId] = React.useState('')
  const [redId, setRedId] = React.useState('')
  const [referencia, setReferencia] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)

  const metodo = metodosPago.find((m) => m.id === metodoId) || metodosPago[0]

  // Auto-seleccionar primer método
  React.useEffect(() => {
    if (open && metodosPago.length > 0 && !metodoId) {
      setMetodoId(metodosPago[0].id)
    }
  }, [open, metodosPago, metodoId])

  // Reset al abrir
  React.useEffect(() => {
    if (open && pedido) {
      setMontoRecibido(pedido.total.toFixed(2))
      setBancoId('')
      setRedId('')
      setReferencia('')
    }
  }, [open, pedido])

  if (!pedido || !metodo) return null

  // Cálculos
  const montoNum = parseFloat(montoRecibido) || 0
  const esEfectivoUsd = metodo.codigo === 'EFECTIVO_USD'
  const esEfectivo = metodo.tipo === 'efectivo'

  const totalEnMoneda = esEfectivoUsd ? pedido.total / 36.6243 : pedido.total
  const cambio = Math.max(0, montoNum - totalEnMoneda)

  const requiereMonto = esEfectivo
  const montoSuficiente = !requiereMonto || montoNum >= totalEnMoneda
  const bancoValido = !metodo.requiereBanco || bancoId !== ''
  const redValida = !metodo.requiereRed || redId !== ''

  const puedeConfirmar =
    montoSuficiente && bancoValido && redValida

  const handleCobrar = async () => {
    if (!puedeConfirmar) return

    setProcesando(true)
    try {
      const resultado = await cobrarPedidoAction(pedido.id, metodo.id, {
        bancoId: bancoId || undefined,
        redTarjetaId: redId || undefined,
        referencia: referencia || undefined,
        montoRecibido: montoNum,
        cambio,
      })

      if (resultado.success) {
        toast.success(
          `Pedido cobrado: Venta ${resultado.ventaNumero} · Factura ${resultado.facturaNumero}`
        )
        onOpenChange(false)
        onSuccess?.(resultado)
      } else {
        toast.error(resultado.error || 'Error al cobrar')
      }
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Cobrar Pedido {pedido.numero}
          </DialogTitle>
          <DialogDescription>
            Se creará la venta y se generará la factura automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-lg bg-primary/10 p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Total a cobrar</p>
            <p className="text-4xl font-bold text-primary">
              {formatearMoneda(pedido.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              Cliente: {pedido.clienteNombre}
            </p>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <div className="grid grid-cols-3 gap-2">
              {metodosPago.map((m) => {
                const Icon = m.icono
                  ? (Icons[
                      m.icono as keyof typeof Icons
                    ] as React.ComponentType<{ className?: string }>)
                  : Icons.CircleDollarSign
                const isActive = metodo.id === m.id
                return (
                  <Button
                    key={m.id}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col items-center gap-1"
                    onClick={() => setMetodoId(m.id)}
                    disabled={procesando}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{m.nombre}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Crédito sin cliente */}
          {metodo.esCredito && !pedido.clienteId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este pedido no tiene cliente asociado. No se puede cobrar a
                crédito.
              </AlertDescription>
            </Alert>
          )}

          {/* Efectivo */}
          {requiereMonto && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Monto recibido ({esEfectivoUsd ? 'USD' : 'C$'})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="text-2xl h-14 text-center font-bold"
                  autoFocus
                  disabled={procesando}
                />
                {montoNum > 0 && !montoSuficiente && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    El monto es menor al total
                  </p>
                )}
              </div>

              {montoNum > 0 && montoSuficiente && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-center border border-green-200 dark:border-green-900">
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Cambio
                  </p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {formatearMoneda(cambio)}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Banco / Red */}
          {metodo.requiereBanco && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>
                    Banco <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={bancoId}
                    onValueChange={setBancoId}
                    disabled={procesando}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancos.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {metodo.requiereRed && (
                  <div className="space-y-2">
                    <Label>Red de tarjeta</Label>
                    <Select
                      value={redId}
                      onValueChange={setRedId}
                      disabled={procesando}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visa, Mastercard..." />
                      </SelectTrigger>
                      <SelectContent>
                        {redesTarjeta.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {metodo.requiereReferencia && (
                  <div className="space-y-2">
                    <Label>Número de referencia</Label>
                    <Input
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Voucher, autorización..."
                      disabled={procesando}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Info de lo que se generará */}
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs">
              Al confirmar se generará:
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Una <strong>Venta</strong> con los items del pedido</li>
                <li>Una <strong>Factura</strong> correlativa</li>
                <li>Se descuenta el <strong>inventario</strong> según recetas</li>
                <li>Se registra en la <strong>caja abierta</strong></li>
                {metodo.esCredito && (
                  <li>Se actualiza el <strong>saldo del cliente</strong></li>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCobrar}
              disabled={
                procesando ||
                !puedeConfirmar ||
                (metodo.esCredito && !pedido.clienteId)
              }
              size="lg"
            >
              {procesando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Cobrar y Facturar
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}