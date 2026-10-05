'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calculator, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchableSelect } from '@/components/ui/searchable-select'

export type RecetaItem = {
  id?: string
  insumoId: string
  cantidad: string
  unidadMedidaId: string
  mermaPorcentaje: string
}

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

type Props = {
  items: RecetaItem[]
  onChange: (items: RecetaItem[]) => void
  insumos: Insumo[]
  unidadesMedida: UnidadMedida[]
}

export function ItemsEditor({ items, onChange, insumos, unidadesMedida }: Props) {
  // ============================================
  // CÁLCULOS
  // ============================================
  const calcularCostoItem = (item: RecetaItem): number => {
    const insumo = insumos.find((i) => i.id === item.insumoId)
    if (!insumo) return 0

    const cantidad = parseFloat(item.cantidad) || 0
    const costoUnitario = parseFloat(insumo.costoUnitario) || 0
    const merma = parseFloat(item.mermaPorcentaje) || 0

    // Costo = cantidad * costoUnitario * (1 + merma/100)
    return cantidad * costoUnitario * (1 + merma / 100)
  }

  const costoTotal = items.reduce((sum, item) => sum + calcularCostoItem(item), 0)

  // ============================================
  // ACCIONES
  // ============================================
  const agregarItem = () => {
    const primerInsumo = insumos[0]
    onChange([
      ...items,
      {
        insumoId: primerInsumo?.id || '',
        cantidad: '1',
        unidadMedidaId: primerInsumo?.unidadMedidaId || '',
        mermaPorcentaje: '0',
      },
    ])
  }

  const eliminarItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const actualizarItem = (
    index: number,
    campo: keyof RecetaItem,
    valor: string
  ) => {
    const nuevos = [...items]
    const itemActualizado = { ...nuevos[index], [campo]: valor }

    // Si cambia el insumo, auto-actualizar la unidad de medida
    if (campo === 'insumoId') {
      const insumo = insumos.find((i) => i.id === valor)
      if (insumo) {
        itemActualizado.unidadMedidaId = insumo.unidadMedidaId
      }
    }

    nuevos[index] = itemActualizado
    onChange(nuevos)
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Insumos de la receta</Label>
          <p className="text-xs text-muted-foreground">
            Agrega los insumos y cantidades que consume este producto
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregarItem}
          disabled={insumos.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar insumo
        </Button>
      </div>

      {insumos.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay insumos registrados. Primero debes crear insumos en el módulo de Insumos.
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay insumos en esta receta. Click en "Agregar insumo" para empezar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, index) => {
              const insumo = insumos.find((i) => i.id === item.insumoId)
              const costoItem = calcularCostoItem(item)

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border p-4 bg-muted/30 space-y-3"
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    {/* Insumo */}
                    <div className="flex-1 min-w-[200px]">
                      <Label className="text-xs">Insumo</Label>
                      <SearchableSelect
                        options={insumos.map((i) => ({
                          value: i.id,
                          label: `${i.nombre} (${i.codigo})`,
                        }))}
                        value={item.insumoId}
                        onValueChange={(v) => actualizarItem(index, 'insumoId', v)}
                        placeholder="Selecciona insumo"
                        searchPlaceholder="Buscar insumo..."
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="w-[120px]">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.cantidad}
                        onChange={(e) =>
                          actualizarItem(index, 'cantidad', e.target.value)
                        }
                        className="h-9"
                      />
                    </div>

                    {/* Unidad */}
                    <div className="w-[100px]">
                      <Label className="text-xs">Unidad</Label>
                      <div className="h-9 px-3 rounded-md border bg-muted flex items-center text-sm">
                        {insumo?.unidadMedida.abreviatura || '—'}
                      </div>
                    </div>

                    {/* Merma */}
                    <div className="w-[100px]">
                      <Label className="text-xs">Merma %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={item.mermaPorcentaje}
                        onChange={(e) =>
                          actualizarItem(index, 'mermaPorcentaje', e.target.value)
                        }
                        className="h-9"
                      />
                    </div>

                    {/* Costo */}
                    <div className="w-[130px]">
                      <Label className="text-xs">Costo</Label>
                      <div className="h-9 px-3 rounded-md border bg-muted flex items-center text-sm font-medium">
                        C$ {costoItem.toFixed(2)}
                      </div>
                    </div>

                    {/* Eliminar */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive mt-5"
                      onClick={() => eliminarItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {insumo && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        Costo unitario: C$ {parseFloat(insumo.costoUnitario).toFixed(2)} / {insumo.unidadMedida.abreviatura}
                      </Badge>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Total */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <span className="font-medium">Costo total de la receta</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                C$ {costoTotal.toFixed(2)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}