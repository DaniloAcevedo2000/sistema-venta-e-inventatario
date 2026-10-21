'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Save, X, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { crearOrdenCompraAction } from '../actions'

type Proveedor = { id: string; nombre: string }
type Insumo = { id: string; codigo: string; nombre: string; costoUnitario: number; unidad: string }

type ItemCarrito = {
  insumoId: string
  descripcion: string
  unidad: string
  cantidad: number
  precioUnitario: number
}

export function NuevaOrdenClient({ proveedores, insumos }: { proveedores: Proveedor[], insumos: Insumo[] }) {
  const router = useRouter()
  
  const [proveedorId, setProveedorId] = React.useState('')
  const [fechaEsperada, setFechaEsperada] = React.useState('')
  const [notas, setNotas] = React.useState('')
  const [items, setItems] = React.useState<ItemCarrito[]>([])
  
  const [busqueda, setBusqueda] = React.useState('')
  const [isPending, setIsPending] = React.useState(false)

  // Filtro de insumos para el buscador
  const insumosFiltrados = React.useMemo(() => {
    if (!busqueda.trim()) return []
    const q = busqueda.toLowerCase()
    return insumos.filter(i => 
      i.nombre.toLowerCase().includes(q) || 
      i.codigo.toLowerCase().includes(q)
    ).slice(0, 5) // Mostrar solo 5 resultados
  }, [busqueda, insumos])

  const agregarInsumo = (insumo: Insumo) => {
    // Verificar si ya está en el carrito
    const existe = items.find(i => i.insumoId === insumo.id)
    if (existe) {
      toast.warning('El insumo ya está en la lista')
      setBusqueda('')
      return
    }

    setItems([...items, {
      insumoId: insumo.id,
      descripcion: insumo.nombre,
      unidad: insumo.unidad,
      cantidad: 1,
      precioUnitario: insumo.costoUnitario
    }])
    setBusqueda('')
  }

  const actualizarCantidad = (index: number, cant: number) => {
    const newItems = [...items]
    newItems[index].cantidad = Math.max(0.01, cant)
    setItems(newItems)
  }

  const actualizarPrecio = (index: number, precio: number) => {
    const newItems = [...items]
    newItems[index].precioUnitario = Math.max(0, precio)
    setItems(newItems)
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Cálculos
  const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0)
  // Asumimos IVA 15% para compras por defecto
  const impuesto = subtotal - (subtotal / 1.15)
  const total = subtotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proveedorId) return toast.error('Selecciona un proveedor')
    if (items.length === 0) return toast.error('Agrega al menos un insumo')

    setIsPending(true)
    const payload = {
      proveedorId,
      fechaEsperada: fechaEsperada || null,
      notas,
      items: items.map(i => ({
        insumoId: i.insumoId,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        tipoImpuesto: 'GRAVADO_15' // Por defecto
      }))
    }

    const formData = new FormData()
    formData.set('payload', JSON.stringify(payload))

    const res = await crearOrdenCompraAction(formData)
    
    if (res.success) {
      toast.success('Orden creada correctamente')
      router.push('/compras')
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor <span className="text-destructive">*</span></Label>
              <Select value={proveedorId} onValueChange={setProveedorId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha Esperada (Opcional)</Label>
              <Input 
                type="date" 
                value={fechaEsperada} 
                onChange={(e) => setFechaEsperada(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Insumos a Comprar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buscador de Insumos */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar insumo por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
            {/* Dropdown de resultados */}
            {busqueda && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover rounded-md border shadow-md z-10 max-h-[200px] overflow-y-auto">
                {insumosFiltrados.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">No se encontraron insumos</div>
                ) : (
                  insumosFiltrados.map(i => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => agregarInsumo(i)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between items-center border-b last:border-0"
                    >
                      <span>{i.nombre} <span className="text-xs text-muted-foreground">({i.codigo})</span></span>
                      <span className="text-xs font-mono">C$ {i.costoUnitario.toFixed(2)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Tabla de items */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="w-[120px]">Cantidad</TableHead>
                  <TableHead className="w-[150px]">Costo Unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No has agregado insumos a la orden
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <p className="font-medium text-sm">{item.descripcion}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(index, parseFloat(e.target.value) || 0)}
                            className="h-8 w-20 text-right"
                          />
                          <span className="text-xs text-muted-foreground">{item.unidad}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={(e) => actualizarPrecio(index, parseFloat(e.target.value) || 0)}
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        C$ {(item.cantidad * item.precioUnitario).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => eliminarItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Entregar en bodega trasera, llamar antes de llegar..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">C$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA Estimado (15%)</span>
              <span className="font-medium text-muted-foreground">Incluido</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold">Total a Pagar</span>
              <span className="font-bold text-xl text-primary">C$ {total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/compras')}>
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button type="submit" disabled={isPending || items.length === 0} className="bg-primary text-primary-foreground">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? 'Guardando Orden...' : 'Guardar Orden de Compra'}
        </Button>
      </div>
    </form>
  )
}