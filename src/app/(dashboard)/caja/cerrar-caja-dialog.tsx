'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  Loader2,
  Lock,
  AlertTriangle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  Equal,
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cerrarCajaAction } from './actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sesionId: string
  cajaNombre: string
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { useFormStatus } = require('react-dom')
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" disabled={pending || disabled}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cerrando...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Confirmar Cierre
        </>
      )}
    </Button>
  )
}

export function CerrarCajaDialog({
  open,
  onOpenChange,
  sesionId,
  cajaNombre,
}: Props) {
  const action = cerrarCajaAction.bind(null, sesionId)
  const [state, formAction] = useActionState(action, undefined)
  const [montoContado, setMontoContado] = React.useState('')

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Caja cerrada correctamente')
      onOpenChange(false)
      window.location.reload()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            Cerrar Caja
          </DialogTitle>
          <DialogDescription>
            Cierra la sesión de {cajaNombre}. Cuenta el efectivo físico e
            ingresa el monto total.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="montoContado">
              Monto contado físicamente (C$){' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="montoContado"
              name="montoContado"
              type="number"
              step="0.01"
              min="0"
              value={montoContado}
              onChange={(e) => setMontoContado(e.target.value)}
              placeholder="0.00"
              className="text-2xl h-14 text-center font-bold"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Cuenta TODO el efectivo en la caja: billetes, monedas, vales
            </p>
          </div>

          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Al confirmar, la sesión quedará cerrada y no se podrá modificar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              placeholder="Ej: Faltan C$ 5 por error en el cambio..."
              rows={3}
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
            <SubmitButton disabled={!montoContado} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}