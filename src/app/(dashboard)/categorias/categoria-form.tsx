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
import { SearchableSelect } from '@/components/ui/searchable-select'
import { IconPicker } from '@/components/ui/icon-picker'

import { crearCategoriaAction, actualizarCategoriaAction } from './actions'

type Categoria = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  padreId: string | null
  icono: string | null
  color: string | null
  orden: number
  activo: boolean
}

type Props = {
  categorias: Categoria[]
  categoria?: Categoria
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
      <Save className="mr-2 h-4 w-4" />
      {pending ? 'Guardando...' : modo === 'crear' ? 'Crear Categoría' : 'Guardar Cambios'}
    </Button>
  )
}

export function CategoriaForm({ categorias, categoria }: Props) {
  const router = useRouter()
  const modo = categoria ? 'editar' : 'crear'

  const [codigo, setCodigo] = React.useState(categoria?.codigo ?? '')
  const [nombre, setNombre] = React.useState(categoria?.nombre ?? '')
  const [descripcion, setDescripcion] = React.useState(categoria?.descripcion ?? '')
  const [padreId, setPadreId] = React.useState(categoria?.padreId ?? '')
  const [icono, setIcono] = React.useState(categoria?.icono ?? '')
  const [color, setColor] = React.useState(categoria?.color ?? '#6B4226')
  const [orden, setOrden] = React.useState(String(categoria?.orden ?? 0))
  const [activo, setActivo] = React.useState(categoria?.activo ?? true)

  const action = categoria
    ? actualizarCategoriaAction.bind(null, categoria.id)
    : crearCategoriaAction

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(action, undefined)

  React.useEffect(() => {
    if (state?.error) toast.error(state.error)
    if (state?.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
      toast.error('Revisa los campos marcados')
    }
  }, [state])

  const generarCodigo = () => {
    const prefijo = nombre
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 3) || 'CAT'
    const numero = Math.floor(Math.random() * 900) + 100
    setCodigo(`${prefijo}-${numero}`)
  }

  const handleSubmit = (formData: FormData) => {
    const payload = {
      codigo,
      nombre,
      descripcion,
      padreId: padreId || null,
      icono: icono || null,
      color: color || null,
      orden,
      activo,
    }
    formData.set('payload', JSON.stringify(payload))
    return formAction(formData)
  }

  // Categorías disponibles como padre (excluyendo la propia y sus descendientes)
  const categoriasPadreDisponibles = categorias.filter((c) => {
    if (modo === 'editar' && c.id === categoria?.id) return false
    return true
  })

  return (
    <form action={handleSubmit} className="space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información de la Categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="BEB-CAL"
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={generarCodigo}>
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
              {state?.fieldErrors?.codigo && (
                <p className="text-xs text-red-500">{state.fieldErrors.codigo[0]}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Bebidas Calientes"
              />
              {state?.fieldErrors?.nombre && (
                <p className="text-xs text-red-500">{state.fieldErrors.nombre[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve de la categoría..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría Padre</Label>
              <SearchableSelect
                options={[
                  { value: '', label: '— Sin categoría padre (Principal) —' },
                  ...categoriasPadreDisponibles.map((c) => ({
                    value: c.id,
                    label: c.nombre,
                  })),
                ]}
                value={padreId}
                onValueChange={(v) => setPadreId(v === '' ? '' : v)}
                placeholder="Selecciona categoría padre"
                searchPlaceholder="Buscar categoría..."
              />
              <p className="text-xs text-muted-foreground">
                Déjalo vacío si es una categoría principal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                min="0"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Número menor = aparece primero
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icono</Label>
              <IconPicker
                value={icono}
                onValueChange={setIcono}
                placeholder="Selecciona un icono"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-16 p-1 cursor-pointer"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {(icono || color) && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <Label className="text-xs text-muted-foreground mb-2 block">Vista previa</Label>
              <div className="flex items-center gap-3">
                {icono && (() => {
                  const Icons = require('lucide-react')
                  const Icon = Icons[icono]
                  return Icon ? (
                    <div
                      className="h-10 w-10 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                  ) : null
                })()}
                <div>
                  <p className="font-medium">{nombre || 'Nombre de la categoría'}</p>
                  <p className="text-xs text-muted-foreground">{codigo || 'CÓDIGO'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Categoría activa</Label>
              <p className="text-xs text-muted-foreground">
                Las categorías inactivas no aparecen en el POS
              </p>
            </div>
            <Switch checked={activo} onCheckedChange={setActivo} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/categorias')}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <SubmitButton modo={modo} />
      </div>
    </form>
  )
}