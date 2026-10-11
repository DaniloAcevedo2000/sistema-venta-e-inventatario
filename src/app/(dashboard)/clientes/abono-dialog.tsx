'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Wallet, DollarSign } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registrarAbonoAction } from './actions'
import type { ClienteRow } from './columnas'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: ClienteRow | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Registrando...
        </>
      ) : (
        <>
          <DollarSign className="mr-2 h-4 w-4" />
          Registrar abono
        </>
      )}
    </Button>
  )
}

export function AbonoDialog({ open, onOpenChange, cliente }: Props) {
  const action = cliente
    ? registrarAbonoAction.bind(null, cliente.id)
    : registrarAbonoAction.bind(null, '')
  const [state, formAction] = useActionState(action, undefined)
  const [monto, setMonto] = React.useState('')

  React.useEffect(() => {
    if (open && cliente) {
      setMonto(cliente.saldoActual.toFixed(2))
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
          <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-4">
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
            <p className="text-3xl font-bold text-red-600">
              C$ {saldo.toFixed(2)}
            </p>
          </div>

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
              className="text-2xl h-14 text-center font-bold"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Máximo: C$ {saldo.toFixed(2)}
            </p>
            {montoNum > saldo && (
              <p className="text-xs text-destructive">
                El monto supera el saldo pendiente
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo">Método de pago</Label>
            <Select name="metodo" defaultValue="EFECTIVO">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="TARJETA">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input
              id="referencia"
              name="referencia"
              placeholder="Ej: Número de transferencia, voucher..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Observaciones del abono"
              rows={2}
            />
          </div>

          {montoNum > 0 && montoNum <= saldo && (
            <>
              <Separator />
              <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo actual</span>
                  <span>C$ {saldo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Abono</span>
                  <span className="text-green-600">
                    - C$ {montoNum.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Nuevo saldo</span>
                  <span className={saldoNuevo > 0 ? 'text-red-600' : 'text-green-600'}>
                    C$ {saldoNuevo.toFixed(2)}
                  </span>
                </div>
                {saldoNuevo < 0.01 && (
                  <p className="text-xs text-green-700 dark:text-green-400 text-center pt-1">
                    ✓ El cliente quedará al día
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
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}