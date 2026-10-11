'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  Loader2,
  Truck,
  Save,
  Mail,
  User,
  Phone,
  Key,
  CheckCircle2,
  Building2,
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  crearRepartidorAction,
  actualizarRepartidorAction,
} from './actions'

type Repartidor = {
  id: string
  nombre: string
  correo: string
  telefono: string | null
  activo: boolean
  sucursalId: string | null
}

type Sucursal = {
  id: string
  nombre: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  repartidor: Repartidor | null
  sucursales: Sucursal[]
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
          {modo === 'crear' ? 'Crear Repartidor' : 'Guardar cambios'}
        </>
      )}
    </Button>
  )
}

export function RepartidorFormDialog({
  open,
  onOpenChange,
  repartidor,
  sucursales,
}: Props) {
  const modo = repartidor ? 'editar' : 'crear'

  const action = repartidor
    ? actualizarRepartidorAction.bind(null, repartidor.id)
    : crearRepartidorAction

  const [state, formAction] = useActionState(action, undefined)

  const [activo, setActivo] = React.useState(repartidor?.activo ?? true)
  const [sucursalId, setSucursalId] = React.useState(
    repartidor?.sucursalId ?? ''
  )

  React.useEffect(() => {
    if (state?.success) {
      toast.success(
        modo === 'crear' ? 'Repartidor creado' : 'Repartidor actualizado'
      )
      onOpenChange(false)
      window.location.reload()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, modo, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {modo === 'crear' ? 'Nuevo Repartidor' : 'Editar Repartidor'}
          </DialogTitle>
          <DialogDescription>
            {modo === 'crear'
              ? 'Registra un nuevo repartidor en el sistema'
              : 'Modifica la información del repartidor'}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={repartidor?.nombre}
              placeholder="Ej: Carlos Ramírez"
              required
            />
            {state?.fieldErrors?.nombre && (
              <p className="text-xs text-red-500">
                {state.fieldErrors.nombre[0]}
              </p>
            )}
          </div>

          {/* Correo */}
          <div className="space-y-2">
            <Label htmlFor="correo" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Correo electrónico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="correo"
              name="correo"
              type="email"
              defaultValue={repartidor?.correo}
              placeholder="repartidor@momotocafe.com"
              required
              disabled={modo === 'editar'}
            />
            {modo === 'editar' && (
              <p className="text-xs text-muted-foreground">
                El correo no se puede modificar
              </p>
            )}
            {state?.fieldErrors?.correo && (
              <p className="text-xs text-red-500">
                {state.fieldErrors.correo[0]}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              Teléfono
            </Label>
            <Input
              id="telefono"
              name="telefono"
              defaultValue={repartidor?.telefono ?? ''}
              placeholder="8888-8888"
            />
          </div>

          {/* Sucursal (solo crear) */}
          {modo === 'crear' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Sucursal (opcional)
              </Label>
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sin sucursal específica</SelectItem>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="sucursalId"
                value={sucursalId === '__none' ? '' : sucursalId}
              />
            </div>
          )}

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="contrasena" className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5" />
              {modo === 'editar' ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              {modo === 'crear' && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="contrasena"
              name="contrasena"
              type="password"
              placeholder={
                modo === 'editar'
                  ? 'Dejar vacío para no cambiar'
                  : 'Mínimo 8 caracteres'
              }
              required={modo === 'crear'}
            />
            {state?.fieldErrors?.contrasena && (
              <p className="text-xs text-red-500">
                {state.fieldErrors.contrasena[0]}
              </p>
            )}
          </div>

          {/* Estado (solo editar) */}
          {modo === 'editar' && (
            <>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Repartidor activo</p>
                  <p className="text-xs text-muted-foreground">
                    Solo los activos pueden recibir pedidos
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

          {/* Info crear */}
          {modo === 'crear' && (
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                Se creará un usuario con el rol <strong>REPARTIDOR</strong>. El
                repartidor podrá iniciar sesión y ver sus pedidos asignados.
              </AlertDescription>
            </Alert>
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