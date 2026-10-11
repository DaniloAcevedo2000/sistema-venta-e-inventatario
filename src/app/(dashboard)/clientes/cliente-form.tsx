'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Save, X, AlertCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { crearClienteAction, actualizarClienteAction } from './actions'

type Cliente = {
  id: string
  codigo: string
  nombre: string
  apellido: string | null
  nombreComercial: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  permiteCredito: boolean
  limiteCredito: string
  notas: string | null
  activo: boolean
}

type Props = {
  cliente?: Cliente
}

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

function SubmitButton({ modo }: { modo: 'crear' | 'editar' }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        'Guardando...'
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {modo === 'crear' ? 'Crear Cliente' : 'Guardar Cambios'}
        </>
      )}
    </Button>
  )
}

export function ClienteForm({ cliente }: Props) {
  const router = useRouter()
  const modo = cliente ? 'editar' : 'crear'

  const [codigo, setCodigo] = React.useState(cliente?.codigo ?? '')
  const [tipoDocumento, setTipoDocumento] = React.useState(
    cliente?.tipoDocumento ?? 'CEDULA'
  )
  const [permiteCredito, setPermiteCredito] = React.useState(
    cliente?.permiteCredito ?? false
  )
  const [activo, setActivo] = React.useState(cliente?.activo ?? true)

  const action = cliente
    ? actualizarClienteAction.bind(null, cliente.id)
    : crearClienteAction

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    action,
    undefined
  )

  React.useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  const generarCodigo = () => {
    const prefijo = 'CLI'
    const numero = Math.floor(Math.random() * 9000) + 1000
    setCodigo(`${prefijo}-${numero}`)
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Info básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>
                Código <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  name="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="CLI-001"
                  className="font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generarCodigo}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
              {state?.fieldErrors?.codigo && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.codigo[0]}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                name="nombre"
                defaultValue={cliente?.nombre}
                placeholder="Juan"
                required
              />
              {state?.fieldErrors?.nombre && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.nombre[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                name="apellido"
                defaultValue={cliente?.apellido ?? ''}
                placeholder="Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre comercial</Label>
              <Input
                name="nombreComercial"
                defaultValue={cliente?.nombreComercial ?? ''}
                placeholder="Solo si es empresa"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select
                name="tipoDocumento"
                value={tipoDocumento}
                onValueChange={setTipoDocumento}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CEDULA">Cédula</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                  <SelectItem value="NINGUNO">Ninguno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Número de documento</Label>
              <Input
                name="numeroDocumento"
                defaultValue={cliente?.numeroDocumento ?? ''}
                placeholder="001-123456-0001A"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                name="telefono"
                defaultValue={cliente?.telefono ?? ''}
                placeholder="8888-8888"
              />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                name="correo"
                type="email"
                defaultValue={cliente?.correo ?? ''}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Textarea
              name="direccion"
              defaultValue={cliente?.direccion ?? ''}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Crédito */}
      <Card>
        <CardHeader>
          <CardTitle>Crédito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Permitir crédito</p>
              <p className="text-xs text-muted-foreground">
                El cliente podrá comprar a crédito hasta el límite
              </p>
            </div>
            <Switch
              checked={permiteCredito}
              onCheckedChange={setPermiteCredito}
            />
          </div>

          {permiteCredito && (
            <div className="space-y-2">
              <Label>Límite de crédito (C$)</Label>
              <Input
                name="limiteCredito"
                type="number"
                step="0.01"
                min="0"
                defaultValue={cliente?.limiteCredito ?? '0'}
                placeholder="2000.00"
              />
              <p className="text-xs text-muted-foreground">
                Máximo que puede deber al mismo tiempo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notas y estado */}
      <Card>
        <CardHeader>
          <CardTitle>Notas y Estado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              name="notas"
              defaultValue={cliente?.notas ?? ''}
              placeholder="Observaciones del cliente..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Cliente activo</p>
              <p className="text-xs text-muted-foreground">
                Los inactivos no aparecen en el POS
              </p>
            </div>
            <Switch checked={activo} onCheckedChange={setActivo} />
          </div>
        </CardContent>
      </Card>

      {/* Hidden inputs */}
      <input
        type="hidden"
        name="permiteCredito"
        value={permiteCredito ? 'on' : 'off'}
      />
      <input type="hidden" name="activo" value={activo ? 'on' : 'off'} />

      {/* Botones */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/clientes')}
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <SubmitButton modo={modo} />
      </div>
    </form>
  )
}