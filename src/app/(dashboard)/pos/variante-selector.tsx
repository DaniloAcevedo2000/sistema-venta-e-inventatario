'use client'

import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePosStore } from '@/lib/stores/pos-store'

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
  destacado: boolean
  permiteDescuento: boolean
  categoriaId: string
  categoriaNombre: string
  variantes: Variante[]
}

type Props = {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VarianteSelector({ producto, open, onOpenChange }: Props) {
  const agregarItem = usePosStore((s) => s.agregarItem)

  if (!producto) return null

  const handleSelect = (variante: Variante) => {
    agregarItem({
      productoId: producto.id,
      varianteId: variante.id,
      codigo: `${producto.codigo}-${variante.codigo}`,
      nombre: producto.nombre,
      nombreVariante: variante.nombre,
      precioUnitario: parseFloat(variante.precio),
      cantidad: 1,
      descuento: 0,
      tipoImpuesto: producto.tipoImpuesto,
      notas: '',
      imagenUrl: producto.imagenUrl,
      color: producto.color,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center"
              style={{ backgroundColor: producto.color || '#6B4226' }}
            >
              <span className="text-sm font-bold text-white">
                {producto.nombre.charAt(0)}
              </span>
            </div>
            <div>
              <p>{producto.nombre}</p>
              <p className="text-xs text-muted-foreground font-normal">
                Selecciona una opción
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {producto.variantes.map((variante) => (
            <Button
              key={variante.id}
              variant="outline"
              className="w-full justify-between h-auto py-4 px-4"
              onClick={() => handleSelect(variante)}
            >
              <span className="font-medium">{variante.nombre}</span>
              <Badge variant="secondary" className="text-sm">
                C$ {parseFloat(variante.precio).toFixed(2)}
              </Badge>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}