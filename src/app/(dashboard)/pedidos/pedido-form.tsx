'use client'

import * as React from 'react'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
  Store,
  User,
  Phone,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SelectorUbicacionWrapper } from '@/components/selector-ubicacion-wrapper'
import { crearPedidoAction } from './actions'

// ============================================
// TIPOS
// ============================================
type Categoria = {
  id: string
  nombre: string
  icono: string | null
  color: string | null
  padreId: string | null
}

type Variante = {
  id: string
  codigo: string
  nombre: string
  precio: string
  orden: number
}

type Producto = {
  id: string
  codigo: string
  nombre: string
  precioBase: string
  tipo: string
  tipoImpuesto: string
  imagenUrl: string | null
  color: string | null
  categoriaId: string
  categoriaNombre: string
  variantes: Variante[]
}

type Zona = {
  id: string
  codigo: string
  nombre: string
  tarifa: number
  color: string | null
}

type Cliente = {
  id: string
  codigo: string
  nombre: string
  apellido: string | null
  nombreComercial: string | null
  telefono: string | null
  direccion: string | null
}

type ItemCarrito = {
  productoId: string
  varianteId: string | null
  nombreProducto: string
  nombreVariante: string | null
  precioUnitario: number
  cantidad: number
  descuento: number
  tipoImpuesto: string
  notas: string
}

type Props = {
  categorias: Categoria[]
  productos: Producto[]
  zonas: Zona[]
  clientes: Cliente[]
}

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ============================================
// HELPERS
// ============================================
function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled} size="lg">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creando pedido...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Crear Pedido
        </>
      )}
    </Button>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function PedidoForm({ categorias, productos, zonas, clientes }: Props) {
  const router = useRouter()

  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================
  const [tipo, setTipo] = React.useState<'DELIVERY' | 'PICKUP'>('DELIVERY')

  // Cliente
  const [clienteId, setClienteId] = React.useState<string>('')
  const [clienteNombre, setClienteNombre] = React.useState('')
  const [clienteTelefono, setClienteTelefono] = React.useState('')
  const [clienteDireccion, setClienteDireccion] = React.useState('')
  const [clienteOpen, setClienteOpen] = React.useState(false)

  // Coordenadas
  const [latitud, setLatitud] = React.useState<number | null>(null)
  const [longitud, setLongitud] = React.useState<number | null>(null)

  // Zona de entrega
  const [zonaId, setZonaId] = React.useState('')

  // Fecha programada
  const [fechaProgramada, setFechaProgramada] = React.useState('')

  // Items
  const [items, setItems] = React.useState<ItemCarrito[]>([])

  // Filtros de productos
  const [categoriaActiva, setCategoriaActiva] = React.useState<string | null>(
    null
  )
  const [busqueda, setBusqueda] = React.useState('')

  // Notas
  const [notas, setNotas] = React.useState('')
  const [notasInternas, setNotasInternas] = React.useState('')

  // Variantes
  const [varianteProducto, setVarianteProducto] =
    React.useState<Producto | null>(null)

  // ============================================
  // SERVER ACTION
  // ============================================
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    crearPedidoAction,
    undefined
  )

  React.useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  // ============================================
  // CÁLCULOS
  // ============================================
  const zonaSeleccionada = zonas.find((z) => z.id === zonaId)
  const costoEnvio =
    tipo === 'DELIVERY' ? (zonaSeleccionada?.tarifa ?? 0) : 0

  const subtotal = items.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0
  )
  const descuentoTotal = items.reduce((sum, item) => {
    const bruto = item.precioUnitario * item.cantidad
    return sum + (bruto * item.descuento) / 100
  }, 0)
  const ivaTotal = items.reduce((sum, item) => {
    const bruto = item.precioUnitario * item.cantidad
    const desc = (bruto * item.descuento) / 100
    const neto = bruto - desc
    return sum + (item.tipoImpuesto === 'GRAVADO_15' ? neto - neto / 1.15 : 0)
  }, 0)
  const total = subtotal - descuentoTotal + costoEnvio

  // ============================================
  // CLIENTE
  // ============================================
  const seleccionarCliente = (cliente: Cliente) => {
    setClienteId(cliente.id)
    setClienteNombre(
      cliente.nombreComercial ||
        `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()
    )
    setClienteTelefono(cliente.telefono ?? '')
    setClienteDireccion(cliente.direccion ?? '')
    setClienteOpen(false)
  }

  const limpiarCliente = () => {
    setClienteId('')
    setClienteNombre('')
    setClienteTelefono('')
    setClienteDireccion('')
    setLatitud(null)
    setLongitud(null)
  }

  // ============================================
  // AGREGAR ITEMS
  // ============================================
  const agregarProducto = (producto: Producto) => {
    if (producto.tipo === 'variantes' && producto.variantes.length > 0) {
      setVarianteProducto(producto)
      return
    }

    setItems((prev) => [
      ...prev,
      {
        productoId: producto.id,
        varianteId: null,
        nombreProducto: producto.nombre,
        nombreVariante: null,
        precioUnitario: parseFloat(producto.precioBase),
        cantidad: 1,
        descuento: 0,
        tipoImpuesto: producto.tipoImpuesto,
        notas: '',
      },
    ])
  }

  const agregarConVariante = (producto: Producto, variante: Variante) => {
    setItems((prev) => [
      ...prev,
      {
        productoId: producto.id,
        varianteId: variante.id,
        nombreProducto: producto.nombre,
        nombreVariante: variante.nombre,
        precioUnitario: parseFloat(variante.precio),
        cantidad: 1,
        descuento: 0,
        tipoImpuesto: producto.tipoImpuesto,
        notas: '',
      },
    ])
    setVarianteProducto(null)
  }

  const eliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const actualizarCantidad = (index: number, cantidad: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, cantidad: Math.max(1, cantidad) } : item
      )
    )
  }

  const actualizarNotas = (index: number, notasItem: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, notas: notasItem } : item))
    )
  }

  // ============================================
  // FILTRAR PRODUCTOS
  // ============================================
  const categoriasPrincipales = categorias.filter((c) => !c.padreId)

  const productosFiltrados = React.useMemo(() => {
    let filtrados = productos

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q)
      )
    } else if (categoriaActiva) {
      const ids = [categoriaActiva]
      const subcats = categorias.filter((c) => c.padreId === categoriaActiva)
      subcats.forEach((s) => ids.push(s.id))
      filtrados = filtrados.filter((p) => ids.includes(p.categoriaId))
    }

    return filtrados
  }, [productos, categoriaActiva, categorias, busqueda])

  // ============================================
  // SUBMIT
  // ============================================
  const handleSubmit = (formData: FormData) => {
    const payload = {
      tipo,
      clienteId: clienteId || null,
      clienteNombre: clienteNombre.trim(),
      clienteTelefono: clienteTelefono.trim(),
      clienteDireccion: tipo === 'DELIVERY' ? clienteDireccion.trim() : null,
      zonaEntregaId: tipo === 'DELIVERY' ? zonaId || null : null,
      fechaProgramada: fechaProgramada || null,

      // Coordenadas
      latitud,
      longitud,

      items: items.map((item) => ({
        productoId: item.productoId,
        varianteId: item.varianteId,
        nombreProducto: item.nombreProducto,
        nombreVariante: item.nombreVariante,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento,
        tipoImpuesto: item.tipoImpuesto,
        notas: item.notas || null,
      })),
      notas: notas.trim() || null,
      notasInternas: notasInternas.trim() || null,
    }

    formData.set('payload', JSON.stringify(payload))
    return formAction(formData)
  }

  // ============================================
  // VALIDACIONES
  // ============================================
  const puedeGuardar =
    items.length > 0 &&
    clienteNombre.trim() &&
    clienteTelefono.trim() &&
    (tipo === 'PICKUP' || (clienteDireccion.trim() && zonaId))

  return (
    <form action={handleSubmit} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive text-sm">Error</p>
            <p className="text-sm text-muted-foreground">{state.error}</p>
          </div>
        </div>
      )}

      {/* ============================================
          TIPO DE PEDIDO
          ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTipo('DELIVERY')}
              className={cn(
                'flex flex-col items-center gap-2 p-6 rounded-lg border-2 transition-all',
                tipo === 'DELIVERY'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <div
                className={cn(
                  'rounded-full p-3',
                  tipo === 'DELIVERY' ? 'bg-primary text-white' : 'bg-muted'
                )}
              >
                <Truck className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Delivery</p>
                <p className="text-xs text-muted-foreground">
                  Entrega a domicilio
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipo('PICKUP')}
              className={cn(
                'flex flex-col items-center gap-2 p-6 rounded-lg border-2 transition-all',
                tipo === 'PICKUP'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <div
                className={cn(
                  'rounded-full p-3',
                  tipo === 'PICKUP' ? 'bg-primary text-white' : 'bg-muted'
                )}
              >
                <Store className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Pickup</p>
                <p className="text-xs text-muted-foreground">
                  Cliente recoge en tienda
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ============================================
          CLIENTE
          ============================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Datos del Cliente</CardTitle>
            {clienteId && (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                Cliente registrado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value)
                    if (clienteId) setClienteId('')
                  }}
                  placeholder="Nombre del cliente"
                  required
                  className="flex-1"
                />
                <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Buscar cliente existente"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron clientes</CommandEmpty>
                        <CommandGroup heading="Clientes">
                          {clientes.map((c) => {
                            const nombre =
                              c.nombreComercial ||
                              `${c.nombre} ${c.apellido ?? ''}`.trim()
                            return (
                              <CommandItem
                                key={c.id}
                                value={`${c.codigo} ${nombre} ${c.telefono ?? ''}`}
                                onSelect={() => seleccionarCliente(c)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    clienteId === c.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {nombre}
                                  </p>
                                  <div className="flex gap-2 text-xs text-muted-foreground">
                                    {c.telefono && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {c.telefono}
                                      </span>
                                    )}
                                    <span className="font-mono">
                                      {c.codigo}
                                    </span>
                                  </div>
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {clienteId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={limpiarCliente}
                    title="Limpiar cliente"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="8888-8888"
                required
              />
            </div>
          </div>

          {tipo === 'DELIVERY' && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Dirección <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  placeholder="Escribe la dirección completa del cliente"
                  rows={2}
                  required
                />
              </div>

              {/* Selector de ubicación con mapa */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Ubicación de entrega
                  <span className="text-xs text-muted-foreground font-normal">
                    (para trazar la ruta)
                  </span>
                </Label>
                <SelectorUbicacionWrapper
                  latitud={latitud}
                  longitud={longitud}
                  onChange={(lat, lng) => {
                    setLatitud(lat)
                    setLongitud(lng)
                  }}
                  centroInicial={[12.1364, -86.2514]}
                  altura="400px"
                  placeholder="Buscar dirección, ej: Plaza Natura Managua"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Zona de entrega <span className="text-destructive">*</span>
                  </Label>
                  <Select value={zonaId} onValueChange={setZonaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {zonas.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span>{z.nombre}</span>
                            <Badge variant="secondary" className="text-xs">
                              {formatearMoneda(z.tarifa)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha/hora programada (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={fechaProgramada}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {tipo === 'PICKUP' && (
            <div className="space-y-2">
              <Label>Fecha/hora programada (opcional)</Label>
              <Input
                type="datetime-local"
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================
          PRODUCTOS
          ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            {!busqueda && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Button
                  type="button"
                  variant={categoriaActiva === null ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setCategoriaActiva(null)}
                >
                  Todas
                </Button>
                {categoriasPrincipales.map((cat) => {
                  const Icon = cat.icono
                    ? (Icons[
                        cat.icono as keyof typeof Icons
                      ] as React.ComponentType<{ className?: string }>)
                    : null
                  const isActive = categoriaActiva === cat.id
                  return (
                    <Button
                      key={cat.id}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="shrink-0 gap-2"
                      onClick={() =>
                        setCategoriaActiva(isActive ? null : cat.id)
                      }
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {cat.nombre}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
            {productosFiltrados.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No se encontraron productos
              </div>
            ) : (
              productosFiltrados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => agregarProducto(p)}
                  className="flex flex-col items-start gap-1 p-3 rounded-lg border-2 hover:border-primary transition-all text-left group"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: p.color || '#6B4226' }}
                    >
                      <span className="text-xs font-bold text-white">
                        {p.nombre.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{p.nombre}</p>
                      <p className="text-xs text-primary font-bold">
                        {formatearMoneda(parseFloat(p.precioBase))}
                      </p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                  </div>
                </button>
              ))
            )}
          </div>

          {items.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    Items agregados ({items.length})
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setItems([])}
                    className="text-destructive text-xs"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Limpiar
                  </Button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {item.nombreProducto}
                            {item.nombreVariante && (
                              <span className="text-muted-foreground font-normal">
                                {' '}
                                · {item.nombreVariante}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatearMoneda(item.precioUnitario)} c/u
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => eliminarItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              actualizarCantidad(index, item.cantidad - 1)
                            }
                            disabled={item.cantidad <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) =>
                              actualizarCantidad(
                                index,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-12 h-7 text-center p-0 text-sm"
                            min="1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              actualizarCantidad(index, item.cantidad + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-semibold text-sm">
                          {formatearMoneda(
                            item.precioUnitario * item.cantidad
                          )}
                        </span>
                      </div>

                      <Input
                        value={item.notas}
                        onChange={(e) =>
                          actualizarNotas(index, e.target.value)
                        }
                        placeholder="Notas especiales (ej: sin azúcar)"
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================================
          NOTAS Y TOTALES
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Notas para el cliente</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Llamar al llegar"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Notas internas (cocina)</Label>
              <Textarea
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                placeholder="Ej: Cliente frecuente, pedido urgente"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatearMoneda(subtotal)}</span>
            </div>
            {descuentoTotal > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Descuento</span>
                <span>- {formatearMoneda(descuentoTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span>{formatearMoneda(ivaTotal)}</span>
            </div>
            {tipo === 'DELIVERY' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Envío {zonaSeleccionada && `(${zonaSeleccionada.nombre})`}
                </span>
                <span>{formatearMoneda(costoEnvio)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL</span>
              <span className="text-primary">{formatearMoneda(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          BOTONES
          ============================================ */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/pedidos')}
          size="lg"
        >
          Cancelar
        </Button>
        <SubmitButton disabled={!puedeGuardar} />
      </div>

      {/* ============================================
          SELECTOR DE VARIANTE (Modal)
          ============================================ */}
      {varianteProducto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold">{varianteProducto.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Selecciona una opción
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setVarianteProducto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {varianteProducto.variantes.map((v) => (
                <Button
                  key={v.id}
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => agregarConVariante(varianteProducto, v)}
                >
                  <span>{v.nombre}</span>
                  <Badge variant="secondary">
                    {formatearMoneda(parseFloat(v.precio))}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}