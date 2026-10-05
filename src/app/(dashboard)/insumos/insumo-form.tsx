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

import { crearInsumoAction, actualizarInsumoAction } from './actions'
import { CATEGORIAS_INSUMO } from './schema'

type UnidadMedida = {
  id: string
  codigo: string
  abreviatura: string
  nombre: string
}

type Insumo = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  unidadMedidaId: string
  categoriaInsumo: string | null
  costoUnitario: string
  stockMinimo: string
  imagenUrl: string | null
  activo: boolean
}

type Props = {
  unidadesMedida: UnidadMedida[]
  insumo?: Insumo
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
      {pending ? 'Guardando...' : modo === 'crear' ? 'Crear Insumo' : 'Guardar Cambios'}
    </Button>
  )
}

export function InsumoForm({ unidadesMedida, insumo }: Props) {
  const router = useRouter()
  const modo = insumo ? 'editar' : 'crear'

  const [codigo, setCodigo] = React.useState(insumo?.codigo ?? '')
  const [nombre, setNombre] = React.useState(insumo?.nombre ?? '')
  const [descripcion, setDescripcion] = React.useState(insumo?.descripcion ?? '')
  const [unidadMedidaId, setUnidadMedidaId] = React.useState(insumo?.unidadMedidaId ?? '')
  const [categoriaInsumo, setCategoriaInsumo] = React.useState(insumo?.categoriaInsumo ?? '')
  const [costoUnitario, setCostoUnitario] = React.useState(insumo?.costoUnitario ?? '0')
  const [stockMinimo, setStockMinimo] = React.useState(insumo?.stockMinimo ?? '0')
  const [imagenUrl, setImagenUrl] = React.useState(insumo?.imagenUrl ?? '')
  const [activo, setActivo] = React.useState(insumo?.activo ?? true)

  const action = insumo
    ? actualizarInsumoAction.bind(null, insumo.id)
    : crearInsumoAction

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(action, undefined)

  React.useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  const generarCodigo = () => {
    const categoria = CATEGORIAS_INSUMO.find((c) => c.value === categoriaInsumo)
    const prefijo = categoria?.value.toUpperCase().slice(0, 3) ?? 'INS'
    const numero = Math.floor(Math.random() * 900) + 100
    setCodigo(`INS-${prefijo}-${numero}`)
  }

  const handleSubmit = (formData: FormData) => {
    const payload = {
      codigo,
      nombre,
      descripcion,
      unidadMedidaId,
      categoriaInsumo,
      costoUnitario,
      stockMinimo,
      imagenUrl,
      activo,
    }
    formData.set('payload', JSON.stringify(payload))
    return formAction(formData)
  }

  const unidadSeleccionada = unidadesMedida.find((u) => u.id === unidadMedidaId)

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
          <CardTitle>Información del Insumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>
                Código <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="INS-CAF-001"
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
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Café en grano - Tueste Medio"
              />
              {state?.fieldErrors?.nombre && (
                <p className="text-xs text-red-500">{state.fieldErrors.nombre[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles adicionales del insumo..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={CATEGORIAS_INSUMO.map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
                value={categoriaInsumo}
                onValueChange={setCategoriaInsumo}
                placeholder="Selecciona categoría"
                searchPlaceholder="Buscar categoría..."
              />
              {state?.fieldErrors?.categoriaInsumo && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.categoriaInsumo[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Unidad de Medida <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={unidadesMedida.map((u) => ({
                  value: u.id,
                  label: `${u.nombre} (${u.abreviatura})`,
                }))}
                value={unidadMedidaId}
                onValueChange={setUnidadMedidaId}
                placeholder="Selecciona unidad"
                searchPlaceholder="Buscar unidad..."
              />
              {state?.fieldErrors?.unidadMedidaId && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.unidadMedidaId[0]}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costos y Stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Costo Unitario (C$) <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                />
                <div className="flex items-center px-3 rounded-md border bg-muted text-sm min-w-[60px] justify-center">
                  / {unidadSeleccionada?.abreviatura ?? '—'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Precio por {unidadSeleccionada?.nombre.toLowerCase() ?? 'unidad'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Stock Mínimo</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                />
                <div className="flex items-center px-3 rounded-md border bg-muted text-sm min-w-[60px] justify-center">
                  {unidadSeleccionada?.abreviatura ?? '—'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Alerta cuando el stock baje de este valor
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presentación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL de imagen</Label>
            <Input
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {imagenUrl && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <Label className="text-xs text-muted-foreground mb-2 block">Vista previa</Label>
              <img
                src={imagenUrl}
                alt="Preview"
                className="h-20 w-20 rounded-md object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
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
              <Label>Insumo activo</Label>
              <p className="text-xs text-muted-foreground">
                Los insumos inactivos no aparecen en recetas ni compras
              </p>
            </div>
            <Switch checked={activo} onCheckedChange={setActivo} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/insumos')}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <SubmitButton modo={modo} />
      </div>
    </form>
  )
}