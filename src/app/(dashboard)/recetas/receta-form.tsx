'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Save, X, AlertCircle, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { crearRecetaAction, actualizarRecetaAction } from './actions'
import { ItemsEditor, type RecetaItem } from './items-editor'

type Insumo = {
  id: string
  codigo: string
  nombre: string
  unidadMedidaId: string
  costoUnitario: string
  unidadMedida: {
    id: string
    codigo: string
    abreviatura: string
    nombre: string
  }
}

type UnidadMedida = {
  id: string
  codigo: string
  abreviatura: string
  nombre: string
}

type Producto = {
  id: string
  codigo: string
  nombre: string
  precioBase: string
  costo: string
  imagenUrl: string | null
  color: string | null
  categoria: { nombre: string }
}

type Receta = {
  id: string
  productoId: string
  notas: string | null
  activa: boolean
  items: RecetaItem[]
}

type Props = {
  producto: Producto
  insumos: Insumo[]
  unidadesMedida: UnidadMedida[]
  receta?: Receta
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
      {pending ? 'Guardando...' : modo === 'crear' ? 'Crear Receta' : 'Guardar Cambios'}
    </Button>
  )
}

export function RecetaForm({ producto, insumos, unidadesMedida, receta }: Props) {
  const router = useRouter()
  const modo = receta ? 'editar' : 'crear'

  const [notas, setNotas] = React.useState(receta?.notas ?? '')
  const [activa, setActiva] = React.useState(receta?.activa ?? true)
  const [items, setItems] = React.useState<RecetaItem[]>(
    receta?.items.map((i) => ({
      id: i.id,
      insumoId: i.insumoId,
      cantidad: String(i.cantidad),
      unidadMedidaId: i.unidadMedidaId,
      mermaPorcentaje: String(i.mermaPorcentaje),
    })) ?? []
  )

  const action = receta
    ? actualizarRecetaAction.bind(null, receta.id)
    : crearRecetaAction

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    action,
    undefined
  )

  React.useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  const handleSubmit = (formData: FormData) => {
    const payload = {
      productoId: producto.id,
      notas,
      activa,
      items: items.map((i) => ({
        insumoId: i.insumoId,
        cantidad: parseFloat(i.cantidad) || 0,
        unidadMedidaId: i.unidadMedidaId,
        mermaPorcentaje: parseFloat(i.mermaPorcentaje) || 0,
      })),
    }
    formData.set('payload', JSON.stringify(payload))
    return formAction(formData)
  }

  // Calcular costo para mostrar margen
  const costoReceta = items.reduce((sum, item) => {
    const insumo = insumos.find((i) => i.id === item.insumoId)
    if (!insumo) return sum
    const cantidad = parseFloat(item.cantidad) || 0
    const costoUnit = parseFloat(insumo.costoUnitario) || 0
    const merma = parseFloat(item.mermaPorcentaje) || 0
    return sum + cantidad * costoUnit * (1 + merma / 100)
  }, 0)

  const precioVenta = parseFloat(producto.precioBase) || 0
  const margen = precioVenta - costoReceta
  const margenPorcentaje = precioVenta > 0 ? (margen / precioVenta) * 100 : 0

  return (
    <form action={handleSubmit} className="space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Info del producto */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div
              className="h-16 w-16 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: producto.color || '#6B4226' }}
            >
              {producto.imagenUrl ? (
                <img
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-white text-xl font-bold">
                  {producto.nombre.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">
                  {producto.codigo}
                </span>
                <Badge variant="outline">{producto.categoria.nombre}</Badge>
              </div>
              <h2 className="text-xl font-bold mt-1">{producto.nombre}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span>
                  <span className="text-muted-foreground">Precio venta:</span>{' '}
                  <strong>C$ {precioVenta.toFixed(2)}</strong>
                </span>
                <span>
                  <span className="text-muted-foreground">Costo receta:</span>{' '}
                  <strong className="text-destructive">
                    C$ {costoReceta.toFixed(2)}
                  </strong>
                </span>
                <Badge
                  variant={
                    margenPorcentaje > 40
                      ? 'default'
                      : margenPorcentaje > 20
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="gap-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  Margen: {margenPorcentaje.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de items */}
      <Card>
        <CardHeader>
          <CardTitle>Insumos y Cantidades</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemsEditor
            items={items}
            onChange={setItems}
            insumos={insumos}
            unidadesMedida={unidadesMedida}
          />
        </CardContent>
      </Card>

      {/* Notas y estado */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notas">Notas / Instrucciones</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Calentar leche a 65°C, no hervir..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Receta activa</Label>
              <p className="text-xs text-muted-foreground">
                Si está inactiva, no se descuenta inventario al vender
              </p>
            </div>
            <Switch checked={activa} onCheckedChange={setActiva} />
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/recetas')}
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <SubmitButton modo={modo} />
      </div>
    </form>
  )
}