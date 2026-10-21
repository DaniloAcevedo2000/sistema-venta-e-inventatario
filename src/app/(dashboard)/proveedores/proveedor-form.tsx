'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Save, X, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { crearProveedorAction, actualizarProveedorAction } from './actions'

type Proveedor = {
  id?: string
  nombre?: string
  nombreComercial?: string | null
  ruc?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  notas?: string | null
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
      {pending ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> {modo === 'crear' ? 'Crear Proveedor' : 'Guardar Cambios'}</>}
    </Button>
  )
}

export function ProveedorForm({ proveedor }: { proveedor?: Proveedor }) {
  const router = useRouter()
  const modo = proveedor?.id ? 'editar' : 'crear'

  const action = proveedor?.id
    ? actualizarProveedorAction.bind(null, proveedor.id)
    : crearProveedorAction

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(action, undefined)

  React.useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Legal <span className="text-destructive">*</span></Label>
              <Input name="nombre" defaultValue={proveedor?.nombre} required />
            </div>
            <div className="space-y-2">
              <Label>Nombre Comercial</Label>
              <Input name="nombreComercial" defaultValue={proveedor?.nombreComercial ?? ''} />
            </div>
            <div className="space-y-2">
              <Label>RUC</Label>
              <Input name="ruc" defaultValue={proveedor?.ruc ?? ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contacto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input name="telefono" defaultValue={proveedor?.telefono ?? ''} />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input name="correo" type="email" defaultValue={proveedor?.correo ?? ''} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Textarea name="direccion" defaultValue={proveedor?.direccion ?? ''} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
        <CardContent>
          <Textarea name="notas" defaultValue={proveedor?.notas ?? ''} rows={3} placeholder="Observaciones..." />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/proveedores')}>
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <SubmitButton modo={modo} />
      </div>
    </form>
  )
}