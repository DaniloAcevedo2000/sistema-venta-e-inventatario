'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Wallet, Save } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconPicker } from '@/components/ui/icon-picker'
import { crearMetodoPagoAction, actualizarMetodoPagoAction } from './actions'

type MetodoPago = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: string
  requiereBanco: boolean
  requiereRed: boolean
  requiereReferencia: boolean
  esCredito: boolean
  icono: string | null
  orden: number
  activo: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  metodo: MetodoPago | null
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
          {modo === 'crear' ? 'Crear método' : 'Guardar cambios'}
        </>
      )}
    </Button>
  )
}

export function MetodoFormDialog({ open, onOpenChange, metodo }: Props) {
  const modo = metodo ? 'editar' : 'crear'

  const action = metodo
    ? actualizarMetodoPagoAction.bind(null, metodo.id)
    : crearMetodoPagoAction

  const [state, formAction] = useActionState(action, undefined)

  const [tipo, setTipo] = React.useState(metodo?.tipo ?? 'efectivo')
  const [icono, setIcono] = React.useState(metodo?.icono ?? '')
  const [requiereBanco, setRequiereBanco] = React.useState(
    metodo?.requiereBanco ?? false
  )
  const [requiereRed, setRequiereRed] = React.useState(
    metodo?.requiereRed ?? false
  )
  const [requiereReferencia, setRequiereReferencia] = React.useState(
    metodo?.requiereReferencia ?? false
  )
  const [esCredito, setEsCredito] = React.useState(metodo?.esCredito ?? false)
  const [activo, setActivo] = React.useState(metodo?.activo ?? true)

  // Reset cuando cambia tipo
  React.useEffect(() => {
    if (tipo === 'efectivo') {
      setRequiereBanco(false)
      setRequiereRed(false)
      setRequiereReferencia(false)
      setEsCredito(false)
    } else if (tipo === 'tarjeta') {
      setRequiereBanco(true)
      setRequiereRed(true)
      setRequiereReferencia(true)
      setEsCredito(false)
    } else if (tipo === 'transferencia') {
      setRequiereBanco(true)
      setRequiereRed(false)
      setRequiereReferencia(true)
      setEsCredito(false)
    } else if (tipo === 'credito') {
      setRequiereBanco(false)
      setRequiereRed(false)
      setRequiereReferencia(false)
      setEsCredito(true)
    }
  }, [tipo])

  React.useEffect(() => {
    if (state?.success) {
      toast.success(
        modo === 'crear' ? 'Método creado' : 'Método actualizado'
      )
      onOpenChange(false)
      window.location.reload()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, modo, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {modo === 'crear' ? 'Nuevo Método de Pago' : 'Editar Método'}
          </DialogTitle>
          <DialogDescription>
            {modo === 'crear'
              ? 'Configura una nueva forma de pago'
              : 'Modifica la configuración del método'}
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
                defaultValue={metodo?.codigo}
                placeholder="EFECTIVO_NIO"
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
                Nombre visible <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={metodo?.nombre}
                placeholder="Efectivo C$"
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
              defaultValue={metodo?.descripcion ?? ''}
              placeholder="Descripción del método"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="tipo" value={tipo} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Icono</Label>
              <IconPicker
                value={icono}
                onValueChange={setIcono}
                placeholder="Selecciona un icono"
              />
              <input type="hidden" name="icono" value={icono} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Requisitos al cobrar</Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Requiere banco</p>
                  <p className="text-xs text-muted-foreground">
                    Seleccionar el banco al cobrar
                  </p>
                </div>
                <Switch
                  checked={requiereBanco}
                  onCheckedChange={setRequiereBanco}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Requiere red de tarjeta</p>
                  <p className="text-xs text-muted-foreground">
                    Visa, Mastercard, etc.
                  </p>
                </div>
                <Switch
                  checked={requiereRed}
                  onCheckedChange={setRequiereRed}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Requiere referencia</p>
                  <p className="text-xs text-muted-foreground">
                    Voucher, código de autorización
                  </p>
                </div>
                <Switch
                  checked={requiereReferencia}
                  onCheckedChange={setRequiereReferencia}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Es crédito</p>
                  <p className="text-xs text-muted-foreground">
                    Requiere cliente con crédito
                  </p>
                </div>
                <Switch checked={esCredito} onCheckedChange={setEsCredito} />
              </div>
            </div>

            {/* Hidden inputs */}
            <input
              type="hidden"
              name="requiereBanco"
              value={requiereBanco ? 'on' : 'off'}
            />
            <input
              type="hidden"
              name="requiereRed"
              value={requiereRed ? 'on' : 'off'}
            />
            <input
              type="hidden"
              name="requiereReferencia"
              value={requiereReferencia ? 'on' : 'off'}
            />
            <input
              type="hidden"
              name="esCredito"
              value={esCredito ? 'on' : 'off'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orden">Orden en POS</Label>
              <Input
                id="orden"
                name="orden"
                type="number"
                min="0"
                defaultValue={metodo?.orden ?? 0}
              />
            </div>

            {modo === 'editar' && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Activo</p>
                  <p className="text-xs text-muted-foreground">
                    Disponible en el POS
                  </p>
                </div>
                <Switch checked={activo} onCheckedChange={setActivo} />
              </div>
            )}
          </div>

          {modo === 'editar' && (
            <input
              type="hidden"
              name="activo"
              value={activo ? 'on' : 'off'}
            />
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