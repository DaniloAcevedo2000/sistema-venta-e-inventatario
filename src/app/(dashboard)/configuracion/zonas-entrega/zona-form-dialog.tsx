'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, MapPin, Save } from 'lucide-react'

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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { crearZonaAction, actualizarZonaAction } from './actions'

type Zona = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tarifa: number
  tiempoEstimadoMin: number | null
  color: string | null
  orden: number
  activa: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  zona: Zona | null
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
          {modo === 'crear' ? 'Crear zona' : 'Guardar cambios'}
        </>
      )}
    </Button>
  )
}

export function ZonaFormDialog({ open, onOpenChange, zona }: Props) {
  const modo = zona ? 'editar' : 'crear'
  const action = zona
    ? actualizarZonaAction.bind(null, zona.id)
    : crearZonaAction

  const [state, formAction] = useActionState(action, undefined)
  const [color, setColor] = React.useState(zona?.color ?? '#6B4226')
  const [activa, setActiva] = React.useState(zona?.activa ?? true)

  React.useEffect(() => {
    if (state?.success) {
      toast.success(modo === 'crear' ? 'Zona creada' : 'Zona actualizada')
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
            <MapPin className="h-5 w-5" />
            {modo === 'crear' ? 'Nueva Zona de Entrega' : 'Editar Zona'}
          </DialogTitle>
          <DialogDescription>
            {modo === 'crear'
              ? 'Crea una nueva zona con su tarifa de envío'
              : 'Modifica la información de la zona'}
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
                defaultValue={zona?.codigo}
                placeholder="CENTRO"
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
                defaultValue={zona?.nombre}
                placeholder="Centro / Cercano"
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
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={zona?.descripcion ?? ''}
              placeholder="Ej: Dentro de 2km"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tarifa">
                Tarifa (C$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tarifa"
                name="tarifa"
                type="number"
                step="0.01"
                min="0"
                defaultValue={zona?.tarifa ?? 0}
                placeholder="30.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiempoEstimadoMin">Tiempo estimado (min)</Label>
              <Input
                id="tiempoEstimadoMin"
                name="tiempoEstimadoMin"
                type="number"
                min="1"
                defaultValue={zona?.tiempoEstimadoMin ?? ''}
                placeholder="15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-16 p-1 cursor-pointer"
                />
                <Input
                  name="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                name="orden"
                type="number"
                min="0"
                defaultValue={zona?.orden ?? 0}
              />
            </div>
          </div>

          {modo === 'editar' && (
            <>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Zona activa</p>
                  <p className="text-xs text-muted-foreground">
                    Solo las activas aparecen al crear pedidos
                  </p>
                </div>
                <Switch checked={activa} onCheckedChange={setActiva} />
                <input
                  type="hidden"
                  name="activa"
                  value={activa ? 'on' : 'off'}
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