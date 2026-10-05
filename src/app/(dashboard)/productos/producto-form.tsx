'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Sparkles,
  Save,
  X,
  AlertCircle,
  Info,
  DollarSign,
  Package,
  Settings,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import { crearProductoAction, actualizarProductoAction } from './actions'
import { ProductoWizardSteps, type Step } from './producto-wizard-steps'
import { ProductoWizardSummary } from './producto-wizard-summary'

type Categoria = {
  id: string
  nombre: string
  codigo: string
  padreId: string | null
}

type Variante = {
  id?: string
  codigo: string
  nombre: string
  precio: string
  costo: string
  orden: number
  activo: boolean
}

type ProductoEdicion = {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  categoriaId: string
  tipo: string
  precioBase: string
  costo: string
  tipoImpuesto: string
  imagenUrl: string
  color: string
  codigoBarras: string
  activo: boolean
  destacado: boolean
  permiteDescuento: boolean
  orden: number
  variantes: Variante[]
}

type Props = {
  categorias: Categoria[]
  producto?: ProductoEdicion
}

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const STEPS: Step[] = [
  { id: 1, title: 'Información Básica', description: 'Datos principales', icon: Info },
  { id: 2, title: 'Precios', description: 'Precio y costo', icon: DollarSign },
  { id: 3, title: 'Tipo', description: 'Variantes y presentación', icon: Package },
  { id: 4, title: 'Opciones', description: 'Configuración final', icon: Settings },
]

function SubmitButton({ modo }: { modo: 'crear' | 'editar' }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      <Save className="mr-2 h-4 w-4" />
      {pending ? 'Guardando...' : modo === 'crear' ? 'Crear Producto' : 'Guardar Cambios'}
    </Button>
  )
}

// ============================================
// EDITOR DE VARIANTES
// ============================================
function VariantesEditor({
  variantes,
  onChange,
  colorProducto,
}: {
  variantes: Variante[]
  onChange: (v: Variante[]) => void
  colorProducto: string
}) {
  const agregar = () => {
    onChange([
      ...variantes,
      {
        codigo: '',
        nombre: '',
        precio: '0',
        costo: '0',
        orden: variantes.length + 1,
        activo: true,
      },
    ])
  }

  const eliminar = (i: number) => onChange(variantes.filter((_, idx) => idx !== i))

  const actualizar = (i: number, campo: keyof Variante, valor: any) => {
    const nuevas = [...variantes]
    nuevas[i] = { ...nuevas[i], [campo]: valor }
    onChange(nuevas)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">Variantes del producto</Label>
        <Button type="button" variant="outline" size="sm" onClick={agregar}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      {variantes.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay variantes. Agrega tamaños como 12oz, 16oz, etc.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {variantes.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap items-end gap-2 rounded-lg border p-3 bg-muted/30"
              >
                <div className="flex-1 min-w-[100px]">
                  <Label className="text-xs">Código</Label>
                  <Input
                    value={v.codigo}
                    onChange={(e) => actualizar(i, 'codigo', e.target.value.toUpperCase())}
                    placeholder="12oz"
                    className="h-9"
                  />
                </div>
                <div className="flex-[2] min-w-[150px]">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={v.nombre}
                    onChange={(e) => actualizar(i, 'nombre', e.target.value)}
                    placeholder="Mediano (12oz)"
                    className="h-9"
                  />
                </div>
                <div className="w-[110px]">
                  <Label className="text-xs">Precio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={v.precio}
                    onChange={(e) => actualizar(i, 'precio', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="w-[110px]">
                  <Label className="text-xs">Costo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={v.costo}
                    onChange={(e) => actualizar(i, 'costo', e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => eliminar(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function ProductoForm({ categorias, producto }: Props) {
  const router = useRouter()
  const modo = producto ? 'editar' : 'crear'

  const [step, setStep] = React.useState(1)
  const [maxStep, setMaxStep] = React.useState(1)

  // ============================================
  // ESTADO CONTROLADO DE TODOS LOS CAMPOS
  // ============================================
  const [codigo, setCodigo] = React.useState(producto?.codigo ?? '')
  const [nombre, setNombre] = React.useState(producto?.nombre ?? '')
  const [descripcion, setDescripcion] = React.useState(producto?.descripcion ?? '')
  const [categoriaId, setCategoriaId] = React.useState(producto?.categoriaId ?? '')
  const [codigoBarras, setCodigoBarras] = React.useState(producto?.codigoBarras ?? '')
  const [precioBase, setPrecioBase] = React.useState(producto?.precioBase ?? '0')
  const [costo, setCosto] = React.useState(producto?.costo ?? '0')
  const [tipoImpuesto, setTipoImpuesto] = React.useState(
    producto?.tipoImpuesto ?? 'GRAVADO_15'
  )
  const [tipo, setTipo] = React.useState(producto?.tipo ?? 'simple')
  const [orden, setOrden] = React.useState(String(producto?.orden ?? 0))
  const [imagenUrl, setImagenUrl] = React.useState(producto?.imagenUrl ?? '')
  const [color, setColor] = React.useState(producto?.color ?? '#6B4226')
  const [activo, setActivo] = React.useState(producto?.activo ?? true)
  const [destacado, setDestacado] = React.useState(producto?.destacado ?? false)
  const [permiteDescuento, setPermiteDescuento] = React.useState(
    producto?.permiteDescuento ?? true
  )
  const [variantes, setVariantes] = React.useState<Variante[]>(
    producto?.variantes ?? []
  )
  const [motivoCambio, setMotivoCambio] = React.useState('')

  const formRef = React.useRef<HTMLFormElement>(null)

  const action = producto
    ? actualizarProductoAction.bind(null, producto.id)
    : crearProductoAction

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    action,
    undefined
  )

  React.useEffect(() => {
    if (state?.success) {
      toast.success(modo === 'crear' ? 'Producto creado' : 'Producto actualizado')
    }
    if (state?.error) {
      toast.error(state.error)
    }
    if (state?.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
      console.error('Errores de validación:', state.fieldErrors)
      toast.error(`Errores: ${Object.keys(state.fieldErrors).join(', ')}`)
    }
    // DEBUG: Mostrar siempre qué devuelve la action
    if (state) {
      console.log('Estado de la action:', state)
    }
  }, [state, modo])

  const generarCodigo = () => {
    const cat = categorias.find((c) => c.id === categoriaId)
    const prefijo = cat?.codigo.split('-')[0] ?? 'PROD'
    const numero = Math.floor(Math.random() * 9000) + 1000
    setCodigo(`${prefijo}-${numero}`)
  }

  const validateStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) {
      if (!codigo.trim()) {
        toast.error('El código es requerido')
        return false
      }
      if (!nombre.trim()) {
        toast.error('El nombre es requerido')
        return false
      }
      if (!categoriaId) {
        toast.error('La categoría es requerida')
        return false
      }
    }
    if (stepNumber === 2) {
      if (!precioBase || parseFloat(precioBase) < 0) {
        toast.error('El precio base es requerido')
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (!validateStep(step)) return
    const next = Math.min(step + 1, STEPS.length)
    setStep(next)
    setMaxStep((prev) => Math.max(prev, next))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = (formData: FormData) => {
    const payload = {
      codigo,
      nombre,
      descripcion,
      categoriaId,
      tipo,
      precioBase,
      costo,
      tipoImpuesto,
      imagenUrl,
      color,
      codigoBarras,
      activo,
      destacado,
      permiteDescuento,
      orden,
      variantes,
      motivoCambio,
    }

    formData.set('payload', JSON.stringify(payload))
    return formAction(formData)
  }

  const categoriaNombre =
    categorias.find((c) => c.id === categoriaId)?.nombre ?? 'Sin categoría'

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-8">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <ProductoWizardSteps
            steps={STEPS}
            currentStep={step}
            maxCompletedStep={maxStep}
            onStepClick={setStep}
          />
        </CardContent>
      </Card>

      {/* Contenido del paso */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* PASO 1: INFORMACIÓN BÁSICA */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código / SKU <span className="text-destructive">*</span> </Label>
                      <div className="flex gap-2">
                        <Input
                          id="codigo"
                          name="codigo"
                          value={codigo}
                          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                          placeholder="CAF-001"
                          required
                          className="font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={generarCodigo}
                          title="Generar código"
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
                      <Label htmlFor="nombre">Nombre <span className="text-destructive">*</span> </Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Latte Vainilla"
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
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Descripción del producto..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="categoriaId">
                        Categoría <span className="text-destructive">*</span>
                      </Label>
                      <SearchableSelect
                        options={categorias.map((cat) => ({
                          value: cat.id,
                          label: cat.nombre,
                          group: cat.padreId
                            ? categorias.find((c) => c.id === cat.padreId)?.nombre || 'Categorías'
                            : 'Categorías principales',
                          indent: !!cat.padreId,
                        }))}
                        value={categoriaId}
                        onValueChange={setCategoriaId}
                        placeholder="Selecciona categoría"
                        searchPlaceholder="Buscar categoría..."
                        emptyMessage="No se encontraron categorías"
                      />
                      <input type="hidden" name="categoriaId" value={categoriaId} />
                      {state?.fieldErrors?.categoriaId && (
                        <p className="text-xs text-red-500">{state.fieldErrors.categoriaId[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigoBarras">Código de barras</Label>
                      <Input
                        id="codigoBarras"
                        name="codigoBarras"
                        value={codigoBarras}
                        onChange={(e) => setCodigoBarras(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </CardContent>

                <p className="text-xs text-muted-foreground">
                  Los campos marcados con <span className="text-destructive">*</span> son obligatorios
                </p>
                
              </Card>
              
            )}

            {/* PASO 2: PRECIOS */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Precios e Impuestos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="precioBase">Precio Base (C$) <span className="text-destructive">*</span> </Label>
                      <Input
                        id="precioBase"
                        name="precioBase"
                        type="number"
                        step="0.01"
                        min="0"
                        value={precioBase}
                        onChange={(e) => setPrecioBase(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="costo">Costo (C$) <span className="text-destructive">*</span> </Label>
                      <Input
                        id="costo"
                        name="costo"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costo}
                        onChange={(e) => setCosto(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipoImpuesto">Tipo de IVA <span className="text-destructive">*</span> </Label>
                      <Select value={tipoImpuesto} onValueChange={setTipoImpuesto}>
                        <SelectTrigger id="tipoImpuesto" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GRAVADO_15">Gravado 15%</SelectItem>
                          <SelectItem value="EXENTO">Exento</SelectItem>
                          <SelectItem value="EXCLUIDO">Excluido</SelectItem>
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="tipoImpuesto" value={tipoImpuesto} />
                    </div>
                  </div>

                  <Alert className="bg-primary/5 border-primary/20">
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      El margen se calcula automáticamente: (Precio - Costo) / Precio × 100
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* PASO 3: TIPO Y PRESENTACIÓN */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Tipo y Presentación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo <span className="text-destructive">*</span> </Label>
                     <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger id="tipo" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="variantes">Con variantes</SelectItem>
                        <SelectItem value="combo">Combo</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="tipo" value={tipo} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orden">Orden en POS</Label>
                      <Input
                        id="orden"
                        name="orden"
                        type="number"
                        min="0"
                        value={orden}
                        onChange={(e) => setOrden(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Color (POS)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          name="color"
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Input
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imagenUrl">URL de imagen</Label>
                    <Input
                      id="imagenUrl"
                      name="imagenUrl"
                      value={imagenUrl}
                      onChange={(e) => setImagenUrl(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>

                  {imagenUrl && (
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Vista previa
                      </Label>
                      <div className="flex items-center gap-3">
                        <img
                          src={imagenUrl}
                          alt="Preview"
                          className="h-16 w-16 rounded-md object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm text-muted-foreground">{color}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {tipo === 'variantes' && (
                    <VariantesEditor
                      variantes={variantes}
                      onChange={setVariantes}
                      colorProducto={color}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* PASO 4: OPCIONES Y RESUMEN */}
            {step === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Opciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <Label>Producto activo</Label>
                        <p className="text-xs text-muted-foreground">
                          Los inactivos no aparecen en el POS
                        </p>
                      </div>
                      <Switch checked={activo} onCheckedChange={setActivo} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <Label>Producto destacado</Label>
                        <p className="text-xs text-muted-foreground">
                          Aparece en la pantalla principal del POS
                        </p>
                      </div>
                      <Switch checked={destacado} onCheckedChange={setDestacado} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <Label>Permite descuentos</Label>
                        <p className="text-xs text-muted-foreground">
                          Si está desactivado, no se aplican descuentos
                        </p>
                      </div>
                      <Switch
                        checked={permiteDescuento}
                        onCheckedChange={setPermiteDescuento}
                      />
                    </div>

                    {modo === 'editar' && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label htmlFor="motivoCambio">
                          Motivo del cambio (opcional)
                        </Label>
                        <Textarea
                          id="motivoCambio"
                          value={motivoCambio}
                          onChange={(e) => setMotivoCambio(e.target.value)}
                          placeholder="Ej: Ajuste de precio por inflación, corrección de categoría..."
                          rows={2}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      Resumen del Producto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductoWizardSummary
                      data={{
                        codigo,
                        nombre,
                        descripcion,
                        categoriaNombre,
                        tipo,
                        precioBase,
                        costo,
                        tipoImpuesto,
                        imagenUrl,
                        color,
                        codigoBarras,
                        activo,
                        destacado,
                        permiteDescuento,
                        orden: parseInt(orden) || 0,
                        variantes,
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <Card>
        <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'h-2 rounded-full transition-all',
                  s.id === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/productos')}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>

            {step < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <SubmitButton modo={modo} />
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  )
}