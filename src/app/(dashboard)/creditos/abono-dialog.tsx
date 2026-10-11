'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  Loader2,
  Wallet,
  Banknote,
  Building2,
  CreditCard,
  Check,
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
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { registrarAbonoAction } from '../clientes/actions'
import type { CreditoRow } from './columnas'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: CreditoRow | null
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Registrando...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Registrar abono
        </>
      )}
    </Button>
  )
}

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: Building2 },
  { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
] as const

export function AbonoDialog({ open, onOpenChange, cliente }: Props) {
  const action = cliente
    ? registrarAbonoAction.bind(null, cliente.id)
    : registrarAbonoAction.bind(null, '')

  const [state, formAction] = useActionState(action, undefined)
  const [monto, setMonto] = React.useState('')
  const [metodo, setMetodo] = React.useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>(
    'EFECTIVO'
  )

  React.useEffect(() => {
    if (open && cliente) {
      setMonto(cliente.saldoActual.toFixed(2))
      setMetodo('EFECTIVO')
    }
  }, [open, cliente])

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Abono registrado correctamente')
      onOpenChange(false)
      window.location.reload()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  if (!cliente) return null

  const saldo = cliente.saldoActual
  const montoNum = parseFloat(monto) || 0
  const saldoNuevo = Math.max(0, saldo - montoNum)
  const esPagoTotal = Math.abs(saldoNuevo) < 0.01

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Registrar Abono
          </DialogTitle>
          <DialogDescription>
            {cliente.nombreComercial || cliente.nombre}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Saldo actual */}
          <div className="rounded-lg border bg-destructive/5 border-destructive/20 p-4">
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
            <p className="text-3xl font-bold text-destructive">
              {formatearMoneda(saldo)}
            </p>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">
              Monto del abono <span className="text-destructive">*</span>
            </Label>
            <Input
              id="monto"
              name="monto"
              type="number"
              step="0.01"
              min="0.01"
              max={saldo}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="text-3xl h-16 text-center font-bold"
              autoFocus
              required
            />
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Máximo: {formatearMoneda(saldo)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMonto(saldo.toFixed(2))}
              >
                Pago total
              </Button>
            </div>
            {montoNum > saldo && (
              <p className="text-xs text-destructive">
                El monto supera el saldo pendiente
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label>
              Método de pago <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map((m) => {
                const Icon = m.icon
                const isActive = metodo === m.value
                return (
                  <Button
                    key={m.value}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => setMetodo(m.value)}
                    className={cn(
                      'h-auto py-4 flex-col gap-1.5',
                      isActive && 'ring-2 ring-primary/30'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{m.label}</span>
                  </Button>
                )
              })}
            </div>
            <input type="hidden" name="metodo" value={metodo} />
          </div>

          {/* Referencia */}
          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input
              id="referencia"
              name="referencia"
              placeholder={
                metodo === 'TRANSFERENCIA'
                  ? 'Número de transferencia'
                  : metodo === 'TARJETA'
                    ? 'Voucher, autorización'
                    : 'Ej: Recibo interno'
              }
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Observaciones del abono"
              rows={2}
            />
          </div>

          {/* Preview del nuevo saldo */}
          {montoNum > 0 && montoNum <= saldo && (
            <>
              <Separator />
              <div
                className={cn(
                  'rounded-lg border p-4 space-y-2',
                  esPagoTotal
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                )}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo actual</span>
                  <span>{formatearMoneda(saldo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Abono ({metodo === 'EFECTIVO' ? 'efectivo' : metodo === 'TRANSFERENCIA' ? 'transferencia' : 'tarjeta'})
                  </span>
                  <span className="text-green-600 font-medium">
                    - {formatearMoneda(montoNum)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Nuevo saldo</span>
                  <span
                    className={
                      saldoNuevo > 0 ? 'text-destructive' : 'text-green-600'
                    }
                  >
                    {formatearMoneda(saldoNuevo)}
                  </span>
                </div>
                {esPagoTotal && (
                  <p className="text-xs text-green-700 dark:text-green-400 text-center pt-1 flex items-center justify-center gap-1">
                    <Check className="h-3 w-3" />
                    El cliente quedará al día
                  </p>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <SubmitButton disabled={montoNum <= 0 || montoNum > saldo} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}