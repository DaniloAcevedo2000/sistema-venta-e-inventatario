'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, CreditCard, Save } from 'lucide-react'

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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { crearRedTarjetaAction, actualizarRedTarjetaAction } from './actions'

type RedTarjeta = {
  id: string
  codigo: string
  nombre: string
  orden: number
  activo: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  red: RedTarjeta | null
}

function SubmitButton({ modo }: { modo: 'crear' | 'editar' }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Guardando...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {modo === 'crear' ? 'Crear red' : 'Guardar cambios'}
        </>
      )}
    </Button>
  )
}

export function RedFormDialog({ open, onOpenChange, red }: Props) {
  const modo = red ? 'editar' : 'crear'

  const action = red
    ? actualizarRedTarjetaAction.bind(null, red.id)
    : crearRedTarjetaAction

  const [state, formAction] = useActionState(action, undefined)
  const [activo, setActivo] = React.useState(red?.activo ?? true)

  React.useEffect(() => {
    if (state?.success) {
      toast.success(modo === 'crear' ? 'Red creada' : 'Red actualizada')
      onOpenChange(false)
      window.location.reload()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, modo, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {modo === 'crear' ? 'Nueva Red de Tarjeta' : 'Editar Red'}
          </DialogTitle>
          <DialogDescription>
            {modo === 'crear'
              ? 'Registra una nueva red de tarjeta'
              : 'Modifica la información de la red'}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={red?.codigo}
                placeholder="VISA"
                className="font-mono"
                required
              />
              {state?.fieldErrors?.codigo && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.codigo[0]}
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={red?.nombre}
                placeholder="Visa"
                required
              />
              {state?.fieldErrors?.nombre && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.nombre[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orden">Orden</Label>
            <Input
              id="orden"
              name="orden"
              type="number"
              min="0"
              defaultValue={red?.orden ?? 0}
            />
          </div>

          {modo === 'editar' && (
            <>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Red activa</p>
                  <p className="text-xs text-muted-foreground">
                    Si está inactiva, no aparece en el POS
                  </p>
                </div>
                <Switch checked={activo} onCheckedChange={setActivo} />
                <input
                  type="hidden"
                  name="activo"
                  value={activo ? 'on' : 'off'}
                />
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
            <SubmitButton modo={modo} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}