'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { registrarMovimientoAction } from './actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sesionId: string
  onSuccess?: () => void
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
        'Registrar Movimiento'
      )}
    </Button>
  )
}

export function MovimientoManualDialog({
  open,
  onOpenChange,
  sesionId,
  onSuccess,
}: Props) {
  const action = registrarMovimientoAction.bind(null, sesionId)
  const [state, formAction] = useActionState(action, undefined)
  const [tipo, setTipo] = React.useState('INGRESO')

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Movimiento registrado')
      onOpenChange(false)
      onSuccess?.()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Movimiento Manual de Caja</DialogTitle>
          <DialogDescription>
            Registra ingresos, egresos o retiros de efectivo
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de movimiento</Label>
            <RadioGroup value={tipo} onValueChange={setTipo}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INGRESO" id="tipo-ingreso" />
                <Label htmlFor="tipo-ingreso" className="cursor-pointer flex items-center gap-2 font-normal">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Ingreso (agrega efectivo)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EGRESO" id="tipo-egreso" />
                <Label htmlFor="tipo-egreso" className="cursor-pointer flex items-center gap-2 font-normal">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Egreso (pago, gasto)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RETIRO" id="tipo-retiro" />
                <Label htmlFor="tipo-retiro" className="cursor-pointer flex items-center gap-2 font-normal">
                  <Minus className="h-4 w-4 text-amber-600" />
                  Retiro (a caja fuerte)
                </Label>
              </div>
            </RadioGroup>
            <input type="hidden" name="tipo" value={tipo} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monto">
              Monto (C$) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="monto"
              name="monto"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="text-2xl h-14 text-center font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              name="motivo"
              placeholder="Ej: Pago de taxi, compra de hielo, retiro parcial..."
              rows={3}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input
              id="referencia"
              name="referencia"
              placeholder="Ej: Número de factura, voucher, etc."
            />
          </div>

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