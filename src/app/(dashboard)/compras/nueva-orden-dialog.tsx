'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { crearOrdenCompraAction } from './actions'

export function NuevaOrdenDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const [proveedores, setProveedores] = React.useState<any[]>([])
  const [insumos, setInsumos] = React.useState<any[]>([])
  const [items, setItems] = React.useState<any[]>([])
  const [isPending, setIsPending] = React.useState(false)

  // Cargar datos al abrir
  React.useEffect(() => {
    if (open) {
      fetch('/api/maestros/compras').then(r => r.json()).then(data => {
        setProveedores(data.proveedores)
        setInsumos(data.insumos)
      })
    }
  }, [open])

  const agregarInsumo = (insumoId: string) => {
    const insumo = insumos.find(i => i.id === insumoId)
    if (!insumo) return
    setItems([...items, {
      insumoId,
      descripcion: insumo.nombre,
      cantidad: 1,
      precioUnitario: insumo.costoUnitario || 0,
      tipoImpuesto: 'GRAVADO_15' // O el que uses para compras
    }])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (items.length === 0) return toast.error('Agrega al menos un ítem')
    
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    const proveedorId = formData.get('proveedorId') as string
    
    const payload = {
      proveedorId,
      items,
      notas: formData.get('notas'),
      fechaEsperada: formData.get('fechaEsperada')
    }
    
    formData.set('payload', JSON.stringify(payload))
    
    const res = await crearOrdenCompraAction(formData)
    if (res.success) {
      toast.success('Orden creada')
      onOpenChange(false)
      setItems([])
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor *</label>
              <Select name="proveedorId" required>
                <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                <SelectContent>
                  {proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Esperada</label>
              <Input name="fechaEsperada" type="date" />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Insumos a comprar</h3>
              <Select onValueChange={agregarInsumo}>
                <SelectTrigger className="w-[250px]"><SelectValue placeholder="+ Agregar insumo" /></SelectTrigger>
                <SelectContent>
                  {insumos.map(i => <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex-1 text-sm">{item.descripcion}</span>
                <Input 
                  type="number" 
                  value={item.cantidad} 
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].cantidad = Number(e.target.value);
                    setItems(newItems);
                  }}
                  className="w-20"
                  min="1"
                />
                <Input 
                  type="number" 
                  value={item.precioUnitario} 
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].precioUnitario = Number(e.target.value);
                    setItems(newItems);
                  }}
                  className="w-24"
                  min="0"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || items.length === 0}>
              {isPending ? 'Creando...' : 'Crear Orden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}