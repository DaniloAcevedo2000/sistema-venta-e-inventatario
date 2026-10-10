'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Unlock, AlertTriangle } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { abrirCajaAction } from './actions'

type Caja = {
  id: string
  codigo: string
  nombre: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cajas: Caja[]
  misSesiones: number
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Abriendo...
        </>
      ) : (
        <>
          <Unlock className="mr-2 h-4 w-4" />
          Abrir Caja
        </>
      )}
    </Button>
  )
}

export function AbrirCajaDialog({
  open,
  onOpenChange,
  cajas,
  misSesiones,
}: Props) {
  const [state, formAction] = useActionState(abrirCajaAction, undefined)

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Caja abierta correctamente')
      onOpenChange(false)
      window.location.reload()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  if (misSesiones > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Sesión abierta
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              Ya tienes una sesión de caja abierta. Debes cerrarla antes de
              abrir otra.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (cajas.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              No hay cajas disponibles
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              Todas las cajas de esta sucursal ya tienen una sesión abierta.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-600" />
            Abrir Caja
          </DialogTitle>
          <DialogDescription>
            Registra el monto inicial con el que empiezas el turno.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cajaId">
              Caja <span className="text-destructive">*</span>
            </Label>
            <Select name="cajaId" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una caja" />
              </SelectTrigger>
              <SelectContent>
                {cajas.map((caja) => (
                  <SelectItem key={caja.id} value={caja.id}>
                    {caja.nombre} ({caja.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoInicial">
              Monto inicial (C$) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="montoInicial"
              name="montoInicial"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              placeholder="0.00"
              className="text-2xl h-14 text-center font-bold"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Efectivo con el que empiezas el turno (para dar cambio)
            </p>
            {state?.fieldErrors?.montoInicial && (
              <p className="text-xs text-red-500">
                {state.fieldErrors.montoInicial[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              placeholder="Ej: Turno matutino, cambio de cajero..."
              rows={2}
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