'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  X,
  User,
  Phone,
  MapPin,
  Truck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  UserPlus,
  Ban,
  Clock,
  Store,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { MapaRutaRealWrapper } from '@/components/mapa-ruta-real-wrapper'
import {
  cambiarEstadoPedidoAction,
  asignarRepartidorAction,
} from './actions'
import {
  getPedidoDetalle,
  getRepartidoresDisponibles,
} from './detalle-actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedidoId: string | null
  permisos: string[]
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

function formatearFecha(fechaISO: string) {
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fechaISO))
}

const LABEL_ESTADO: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-zinc-500' },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-blue-500' },
  EN_PREPARACION: { label: 'En preparación', color: 'bg-amber-500' },
  LISTO: { label: 'Listo', color: 'bg-purple-500' },
  EN_CAMINO: { label: 'En camino', color: 'bg-cyan-500' },
  ENTREGADO: { label: 'Entregado', color: 'bg-green-600' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-600' },
}

const SIGUIENTE_ESTADO: Record<string, { estado: string; label: string }> = {
  PENDIENTE: { estado: 'CONFIRMADO', label: 'Confirmar pedido' },
  CONFIRMADO: { estado: 'EN_PREPARACION', label: 'Iniciar preparación' },
  EN_PREPARACION: { estado: 'LISTO', label: 'Marcar como listo' },
  LISTO: { estado: 'ENTREGADO', label: 'Entregar (pickup)' },
  EN_CAMINO: { estado: 'ENTREGADO', label: 'Marcar entregado' },
}

export function PedidoDetalleDialog({
  open,
  onOpenChange,
  pedidoId,
  permisos,
}: Props) {
  const [pedido, setPedido] = React.useState<any>(null)
  const [cargando, setCargando] = React.useState(false)
  const [repartidores, setRepartidores] = React.useState<any[]>([])
  const [repartidorSeleccionado, setRepartidorSeleccionado] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)
  const [cancelarOpen, setCancelarOpen] = React.useState(false)
  const [motivoCancelar, setMotivoCancelar] = React.useState('')

  const cargarPedido = React.useCallback(async () => {
    if (!pedidoId) return
    setCargando(true)
    try {
      const [data, reps] = await Promise.all([
        getPedidoDetalle(pedidoId),
        getRepartidoresDisponibles(),
      ])
      setPedido(data)
      setRepartidores(reps)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCargando(false)
    }
  }, [pedidoId])

  React.useEffect(() => {
    if (!open || !pedidoId) return
    cargarPedido()
  }, [open, pedidoId, cargarPedido])

  const puedeEditar = permisos.includes('pedidos:editar')
  const puedeAsignar = permisos.includes('pedidos:asignar_repartidor')
  const puedeCancelar = permisos.includes('pedidos:cancelar')

  const cambiarEstado = async (nuevoEstado: string, motivo?: string) => {
    if (!pedidoId) return
    setProcesando(true)
    try {
      const result = await cambiarEstadoPedidoAction(
        pedidoId,
        nuevoEstado,
        motivo
      )
      if (result.success) {
        toast.success('Estado actualizado')
        await cargarPedido()
      } else {
        toast.error(result.error || 'Error')
      }
    } finally {
      setProcesando(false)
    }
  }

  const asignarRepartidor = async () => {
    if (!pedidoId || !repartidorSeleccionado) {
      toast.error('Selecciona un repartidor')
      return
    }
    setProcesando(true)
    try {
      const result = await asignarRepartidorAction(
        pedidoId,
        repartidorSeleccionado
      )
      if (result.success) {
        toast.success('Repartidor asignado')
        await cargarPedido()
      } else {
        toast.error(result.error || 'Error')
      }
    } finally {
      setProcesando(false)
    }
  }

  if (!pedido) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            {cargando ? 'Cargando...' : 'Sin datos'}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const estadoConfig = LABEL_ESTADO[pedido.estado] ?? {
    label: pedido.estado,
    color: 'bg-zinc-500',
  }
  const siguiente = SIGUIENTE_ESTADO[pedido.estado]
  const estaActivo = !['ENTREGADO', 'CANCELADO'].includes(pedido.estado)

  // ============================================
  // VALIDACIÓN PARA MOSTRAR MAPA
  // ============================================
  const puedeMostrarMapa =
    pedido.tipo === 'DELIVERY' &&
    pedido.latitud !== null &&
    pedido.longitud !== null &&
    pedido.latitudNegocio !== null &&
    pedido.longitudNegocio !== null &&
    pedido.latitudNegocio !== 0 &&
    pedido.longitudNegocio !== 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="!max-w-[95vw] w-[95vw] h-[92vh] !p-0 overflow-hidden flex flex-col gap-0"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {pedido.numero}
                <Badge className={estadoConfig.color}>{estadoConfig.label}</Badge>
                <Badge variant={pedido.tipo === 'DELIVERY' ? 'default' : 'secondary'}>
                  {pedido.tipo === 'DELIVERY' ? '🛵 Delivery' : '🏪 Pickup'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {formatearFecha(pedido.creadoEn)}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatearMoneda(pedido.total)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre</p>
                    <p className="font-medium">{pedido.clienteNombre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{pedido.clienteTelefono}</p>
                  </div>
                </div>

                {pedido.tipo === 'DELIVERY' && pedido.clienteDireccion && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Dirección
                      </p>
                      <p className="font-medium">{pedido.clienteDireccion}</p>
                      {pedido.zonaNombre && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {pedido.zonaNombre}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {pedido.tipo === 'PICKUP' && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <Store className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Recojo en tienda
                      </p>
                      <p className="font-medium">{pedido.sucursalNombre}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mapa de ruta (solo delivery con coordenadas) */}
            {puedeMostrarMapa && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ruta de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MapaRutaRealWrapper 
                    latitudOrigen={pedido.latitudNegocio}
                    longitudOrigen={pedido.longitudNegocio}
                    latitudDestino={pedido.latitud}
                    longitudDestino={pedido.longitud}
                    nombreOrigen="Momoto Café"
                    nombreDestino={pedido.clienteNombre}
                    altura="400px"
                  />
                </CardContent>
              </Card>
            )}

            {/* Aviso si no hay coordenadas */}
            {pedido.tipo === 'DELIVERY' &&
              (!pedido.latitud ||
                !pedido.longitud ||
                !pedido.latitudNegocio ||
                !pedido.longitudNegocio) && (
                <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
                  <CardContent className="pt-6 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-amber-900 dark:text-amber-200">
                        Sin coordenadas para el mapa
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                        Configura la ubicación del negocio en
                        `/configuracion/negocio` y asegúrate de que el pedido
                        tenga coordenadas de entrega.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cant.</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedido.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {item.nombreProducto}
                              </p>
                              {item.nombreVariante && (
                                <p className="text-xs text-muted-foreground">
                                  {item.nombreVariante}
                                </p>
                              )}
                              {item.notas && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  "{item.notas}"
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.cantidad}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatearMoneda(item.precioUnitario)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatearMoneda(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatearMoneda(pedido.subtotal)}</span>
                  </div>
                  {pedido.descuento > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Descuento</span>
                      <span>- {formatearMoneda(pedido.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA</span>
                    <span>{formatearMoneda(pedido.impuesto)}</span>
                  </div>
                  {pedido.costoEnvio > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envío</span>
                      <span>{formatearMoneda(pedido.costoEnvio)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>TOTAL</span>
                    <span className="text-primary">
                      {formatearMoneda(pedido.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            {(pedido.notas || pedido.notasInternas) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedido.notas && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Notas para el cliente
                      </p>
                      <p className="text-sm italic">"{pedido.notas}"</p>
                    </div>
                  )}
                  {pedido.notasInternas && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Notas internas
                      </p>
                      <p className="text-sm italic">
                        "{pedido.notasInternas}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Asignación de repartidor */}
            {pedido.tipo === 'DELIVERY' &&
              estaActivo &&
              puedeAsignar &&
              !pedido.repartidorNombre && (
                <Card className="border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/10">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Asignar Repartidor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={repartidorSeleccionado}
                      onValueChange={setRepartidorSeleccionado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona repartidor" />
                      </SelectTrigger>
                      <SelectContent>
                        {repartidores.length === 0 ? (
                          <SelectItem value="__empty" disabled>
                            No hay repartidores disponibles
                          </SelectItem>
                        ) : (
                          repartidores.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={asignarRepartidor}
                      disabled={!repartidorSeleccionado || procesando}
                      className="w-full"
                    >
                      {procesando ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Truck className="mr-2 h-4 w-4" />
                      )}
                      Asignar y enviar
                    </Button>
                  </CardContent>
                </Card>
              )}

            {/* Repartidor asignado */}
            {pedido.repartidorNombre && (
              <Card className="border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/10">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="rounded-full bg-cyan-100 dark:bg-cyan-900/40 p-2">
                    <Truck className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Repartidor</p>
                    <p className="font-medium">{pedido.repartidorNombre}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Historial del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TimelineItem label="Creado" fecha={pedido.creadoEn} completado />
                {pedido.confirmadoEn && (
                  <TimelineItem
                    label="Confirmado"
                    fecha={pedido.confirmadoEn}
                    completado
                  />
                )}
                {pedido.preparacionEn && (
                  <TimelineItem
                    label="En preparación"
                    fecha={pedido.preparacionEn}
                    completado
                  />
                )}
                {pedido.listoEn && (
                  <TimelineItem
                    label="Listo"
                    fecha={pedido.listoEn}
                    completado
                  />
                )}
                {pedido.enCaminoEn && (
                  <TimelineItem
                    label="En camino"
                    fecha={pedido.enCaminoEn}
                    completado
                  />
                )}
                {pedido.entregadoEn && (
                  <TimelineItem
                    label="Entregado"
                    fecha={pedido.entregadoEn}
                    completado
                  />
                )}
                {pedido.canceladoEn && (
                  <TimelineItem
                    label={`Cancelado${pedido.motivoCancelacion ? `: ${pedido.motivoCancelacion}` : ''}`}
                    fecha={pedido.canceladoEn}
                    completado
                    variant="destructive"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer con acciones */}
          {estaActivo && puedeEditar && (
            <div className="p-4 border-t bg-muted/30 flex items-center justify-between gap-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setCancelarOpen(true)}
                disabled={procesando || !puedeCancelar}
                className="text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancelar pedido
              </Button>

              {siguiente && (
                <Button
                  onClick={() => cambiarEstado(siguiente.estado)}
                  disabled={procesando}
                  size="lg"
                >
                  {procesando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {siguiente.label}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de cancelación */}
      <Dialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Cancelar Pedido
            </DialogTitle>
            <DialogDescription>
              El pedido {pedido.numero} será cancelado. Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Motivo <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={motivoCancelar}
              onChange={(e) => setMotivoCancelar(e.target.value)}
              placeholder="Ej: Cliente canceló, ya no hay producto..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelarOpen(false)}
              disabled={procesando}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await cambiarEstado('CANCELADO', motivoCancelar)
                setCancelarOpen(false)
              }}
              disabled={procesando || motivoCancelar.trim().length < 3}
            >
              {procesando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              Cancelar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================
// Timeline item
// ============================================
function TimelineItem({
  label,
  fecha,
  completado,
  variant = 'default',
}: {
  label: string
  fecha: string
  completado: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
          variant === 'destructive'
            ? 'bg-destructive'
            : completado
              ? 'bg-green-500'
              : 'bg-muted'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {formatearFecha(fecha)}
        </p>
      </div>
      {variant !== 'destructive' && (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      )}
    </div>
  )
}