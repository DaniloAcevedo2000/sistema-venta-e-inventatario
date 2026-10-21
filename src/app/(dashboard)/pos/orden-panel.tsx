'use client'

import * as React from 'react'
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Receipt,
  Percent,
  StickyNote,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { usePosStore } from '@/lib/stores/pos-store'
import { CobrarDialog } from './cobrar-dialog'
import { VentaExitosaDialog } from './venta-exitosa-dialog'
import type {
  MetodoPagoConfig,
  BancoConfig,
  RedTarjetaConfig,
  SesionCajaInfo,
  ClienteConfig,
} from './pos-interface'

type Usuario = {
  id: string
  nombre: string
  sucursalId: string | null
  sucursalNombre: string | null
  permisos: string[]
}

type Props = {
  usuario: Usuario
  tasaCambio: number
  metodosPago: MetodoPagoConfig[]
  bancos: BancoConfig[]
  redesTarjeta: RedTarjetaConfig[]
  clientes: ClienteConfig[]
  stockPorProductoId: Record<string, number>
  sesionCajaAbierta: SesionCajaInfo
}

export function OrdenPanel({
  usuario,
  tasaCambio,
  metodosPago,
  bancos,
  redesTarjeta,
  clientes,
  stockPorProductoId,
  sesionCajaAbierta,
}: Props) {
  const items = usePosStore((s) => s.items)
  const eliminarItem = usePosStore((s) => s.eliminarItem)
  const actualizarCantidad = usePosStore((s) => s.actualizarCantidad)
  const actualizarDescuento = usePosStore((s) => s.actualizarDescuento)
  const actualizarNotas = usePosStore((s) => s.actualizarNotas)
  const limpiar = usePosStore((s) => s.limpiar)
  const subtotal = usePosStore((s) => s.subtotal())
  const descuentoTotal = usePosStore((s) => s.descuentoTotal())
  const ivaTotal = usePosStore((s) => s.ivaTotal())
  const total = usePosStore((s) => s.total())
  const cantidadItems = usePosStore((s) => s.cantidadItems())

  const [cobrarOpen, setCobrarOpen] = React.useState(false)
  const [ventaExitosa, setVentaExitosa] = React.useState<any>(null)

  // ============================================
  // VALIDACIÓN DE STOCK
  // ============================================
  const cantidadPorProducto = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of items) {
      map[item.productoId] = (map[item.productoId] ?? 0) + item.cantidad
    }
    return map
  }, [items])

  const itemSuperaStock = (productoId: string): boolean => {
    const disponible = stockPorProductoId[productoId]
    if (disponible === undefined) return false
    const enCarrito = cantidadPorProducto[productoId] ?? 0
    return enCarrito > disponible
  }

  const itemsExcedidos = items.filter((i) => itemSuperaStock(i.productoId))
  const hayExceso = itemsExcedidos.length > 0

  const puedeCobrar = items.length > 0 && !hayExceso
  const puedeDescontar = usuario.permisos.includes('ventas:descuento')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Orden Actual
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {usuario.sucursalNombre} · {usuario.nombre}
            </p>
            <Badge variant="secondary" className="mt-1.5 text-xs gap-1">
              <Wallet className="h-3 w-3" />
              {sesionCajaAbierta.cajaNombre}
            </Badge>
          </div>
          {items.length > 0 && (
            <Badge variant="secondary">
              {cantidadItems} {cantidadItems === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-6">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">La orden está vacía</p>
              <p className="text-xs">Toca un producto para agregarlo</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {items.map((item) => {
              const excedido = itemSuperaStock(item.productoId)
              const disponible = stockPorProductoId[item.productoId]
              const enCarrito = cantidadPorProducto[item.productoId] ?? 0

              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  excedido={excedido}
                  disponible={disponible}
                  enCarrito={enCarrito}
                  puedeDescontar={puedeDescontar}
                  onEliminar={() => eliminarItem(item.id)}
                  onCantidadChange={(c) => actualizarCantidad(item.id, c)}
                  onDescuentoChange={(d) => actualizarDescuento(item.id, d)}
                  onNotasChange={(n) => actualizarNotas(item.id, n)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Totales */}
      {items.length > 0 && (
        <>
          <Separator />

          {hayExceso && (
            <div className="mx-3 mt-3 p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-destructive">
                  Hay productos sin stock suficiente
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Ajusta las cantidades antes de cobrar.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">C$ {subtotal.toFixed(2)}</span>
            </div>

            {descuentoTotal > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Descuento</span>
                <span className="font-medium">
                  - C$ {descuentoTotal.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA 15%</span>
              <span className="font-medium">C$ {ivaTotal.toFixed(2)}</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">TOTAL</span>
              <div className="text-right">
                <span className="font-bold text-2xl text-primary">
                  C$ {total.toFixed(2)}
                </span>
                <p className="text-xs text-muted-foreground">
                  ≈ USD ${(total / tasaCambio).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('¿Vaciar la orden actual?')) {
                    limpiar()
                  }
                }}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vaciar
              </Button>
              <Button
                onClick={() => setCobrarOpen(true)}
                disabled={!puedeCobrar}
                className="flex-1 h-11"
                size="lg"
                title={
                  hayExceso ? 'Hay productos sin stock suficiente' : undefined
                }
              >
                <Receipt className="mr-2 h-4 w-4" />
                Cobrar
              </Button>
            </div>
          </div>
        </>
      )}

      <CobrarDialog
        open={cobrarOpen}
        onOpenChange={setCobrarOpen}
        usuario={usuario}
        tasaCambio={tasaCambio}
        metodosPago={metodosPago}
        bancos={bancos}
        redesTarjeta={redesTarjeta}
        clientes={clientes}
        sesionCajaId={sesionCajaAbierta.id}
        onVentaCreada={(venta) => {
          setVentaExitosa(venta)
          setCobrarOpen(false)
        }}
      />

      <VentaExitosaDialog
        open={!!ventaExitosa}
        onOpenChange={(open) => !open && setVentaExitosa(null)}
        venta={ventaExitosa}
      />
    </div>
  )
}

// ============================================
// ItemCard
// ============================================
function ItemCard({
  item,
  excedido,
  disponible,
  enCarrito,
  puedeDescontar,
  onEliminar,
  onCantidadChange,
  onDescuentoChange,
  onNotasChange,
}: {
  item: {
    id: string
    productoId: string
    nombre: string
    nombreVariante: string | null
    precioUnitario: number
    cantidad: number
    descuento: number
    notas: string
    color: string | null
  }
  excedido: boolean
  disponible: number | undefined
  enCarrito: number
  puedeDescontar: boolean
  onEliminar: () => void
  onCantidadChange: (c: number) => void
  onDescuentoChange: (d: number) => void
  onNotasChange: (n: string) => void
}) {
  const [descuentoOpen, setDescuentoOpen] = React.useState(false)
  const [notasOpen, setNotasOpen] = React.useState(false)
  const [descuentoInput, setDescuentoInput] = React.useState(
    String(item.descuento)
  )
  const [notasInput, setNotasInput] = React.useState(item.notas)

  const subtotal = item.precioUnitario * item.cantidad
  const descuentoMonto = (subtotal * item.descuento) / 100
  const totalItem = subtotal - descuentoMonto

  const puedeAumentar = disponible === undefined || enCarrito < disponible

  const intentarAumentar = () => {
    if (!puedeAumentar) {
      toast.error(`No hay más stock. Disponible: ${disponible ?? 0}`, {
        id: `stock-${item.productoId}`,
      })
      return
    }
    onCantidadChange(item.cantidad + 1)
  }

  const aplicarDescuento = () => {
    const valor = Math.max(0, Math.min(100, parseFloat(descuentoInput) || 0))
    onDescuentoChange(valor)
    setDescuentoOpen(false)
  }

  const guardarNotas = () => {
    onNotasChange(notasInput.trim())
    setNotasOpen(false)
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 space-y-2 transition-colors',
        excedido && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: item.color || '#6B4226' }}
        >
          <span className="text-sm font-bold text-white">
            {item.nombre.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight">{item.nombre}</p>
          {item.nombreVariante && (
            <p className="text-xs text-muted-foreground">
              {item.nombreVariante}
            </p>
          )}
          <p className="text-sm font-semibold text-primary mt-0.5">
            C$ {item.precioUnitario.toFixed(2)} c/u
          </p>
          {item.notas && (
            <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
              "{item.notas}"
            </p>
          )}
          {item.descuento > 0 && (
            <Badge variant="destructive" className="mt-1 text-xs">
              -{item.descuento}% descuento
            </Badge>
          )}

          {excedido && (
            <Badge
              variant="destructive"
              className="mt-1.5 text-xs gap-1 w-fit"
            >
              <AlertTriangle className="h-3 w-3" />
              Excede stock ({enCarrito}/{disponible ?? 0})
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
          onClick={onEliminar}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCantidadChange(Math.max(1, item.cantidad - 1))}
            disabled={item.cantidad <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={item.cantidad}
            onChange={(e) =>
              onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))
            }
            className={cn(
              'w-12 h-7 text-center p-0 text-sm',
              excedido && 'border-destructive text-destructive'
            )}
            min="1"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={intentarAumentar}
            disabled={!puedeAumentar}
            title={
              !puedeAumentar ? `Stock máximo: ${disponible ?? 0}` : undefined
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <span className="font-semibold text-sm">
          C$ {totalItem.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {puedeDescontar && (
          <Popover open={descuentoOpen} onOpenChange={setDescuentoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 text-xs gap-1',
                  item.descuento > 0 && 'text-destructive'
                )}
              >
                <Percent className="h-3 w-3" />
                Descuento
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`desc-${item.id}`} className="text-xs">
                    Porcentaje de descuento
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id={`desc-${item.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={descuentoInput}
                      onChange={(e) => setDescuentoInput(e.target.value)}
                      className="h-8"
                    />
                    <Button size="sm" onClick={aplicarDescuento} className="h-8">
                      Aplicar
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Rápidos:</p>
                  <div className="grid grid-cols-4 gap-1">
                    {[5, 10, 15, 20].map((p) => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setDescuentoInput(String(p))
                          onDescuentoChange(p)
                          setDescuentoOpen(false)
                        }}
                      >
                        {p}%
                      </Button>
                    ))}
                  </div>
                </div>

                {item.descuento > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => {
                      setDescuentoInput('0')
                      onDescuentoChange(0)
                      setDescuentoOpen(false)
                    }}
                  >
                    Quitar descuento
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn('h-7 text-xs gap-1', item.notas && 'text-primary')}
          onClick={() => {
            setNotasInput(item.notas)
            setNotasOpen(true)
          }}
        >
          <StickyNote className="h-3 w-3" />
          Nota
        </Button>

        <Dialog open={notasOpen} onOpenChange={setNotasOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notas para {item.nombre}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={notasInput}
                onChange={(e) => setNotasInput(e.target.value)}
                placeholder="Ej: Sin azúcar, leche deslactosada, extra caliente..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNotasOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarNotas}>Guardar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}