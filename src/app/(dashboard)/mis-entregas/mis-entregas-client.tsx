'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Truck,
  MapPin,
  Phone,
  User,
  Package,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Eye,
  Navigation,
  DollarSign,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapaRutaRealWrapper } from '@/components/mapa-ruta-real-wrapper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  getMisEntregas,
  getEntregaDetalle,
  marcarEntregadoAction,
} from './actions'

type Entrega = {
  id: string
  numero: string
  estado: string
  clienteNombre: string
  clienteTelefono: string
  clienteDireccion: string | null
  zonaNombre: string | null
  sucursalNombre: string
  cantidadItems: number
  total: number
  costoEnvio: number
  notas: string | null
  notasInternas: string | null
  latitud: number | null
  longitud: number | null
  latitudNegocio: number
  longitudNegocio: number
  creadoEn: string
  enCaminoEn: string | null
  entregadoEn: string | null
}

type Props = {
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

function tiempoTranscurrido(fechaISO: string) {
  const ahora = new Date()
  const fecha = new Date(fechaISO)
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60000)

  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas}h`
  const dias = Math.floor(horas / 24)
  return `hace ${dias}d`
}

export function MisEntregasClient({ permisos }: Props) {
  const [entregas, setEntregas] = React.useState<Entrega[]>([])
  const [cargando, setCargando] = React.useState(true)
  const [actualizando, setActualizando] = React.useState(false)
  const [detalleOpen, setDetalleOpen] = React.useState(false)
  const [entregaDetalle, setEntregaDetalle] = React.useState<any>(null)
  const [cargandoDetalle, setCargandoDetalle] = React.useState(false)
  const [procesando, setProcesando] = React.useState(false)

  const cargarEntregas = React.useCallback(async () => {
    try {
      const data = await getMisEntregas()
      setEntregas(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }, [])

  React.useEffect(() => {
    cargarEntregas()
    // Refrescar cada 30 segundos
    const interval = setInterval(cargarEntregas, 30000)
    return () => clearInterval(interval)
  }, [cargarEntregas])

  const handleRefresh = () => {
    setActualizando(true)
    cargarEntregas()
  }

  const abrirDetalle = async (entrega: Entrega) => {
    setDetalleOpen(true)
    setCargandoDetalle(true)
    try {
      const data = await getEntregaDetalle(entrega.id)
      setEntregaDetalle(data)
    } catch (err: any) {
      toast.error(err.message)
      setDetalleOpen(false)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const marcarEntregado = async (pedidoId: string) => {
    setProcesando(true)
    try {
      const result = await marcarEntregadoAction(pedidoId)
      if (result.success) {
        toast.success('¡Pedido marcado como entregado!')
        setDetalleOpen(false)
        setEntregaDetalle(null)
        await cargarEntregas()
      } else {
        toast.error(result.error || 'Error')
      }
    } finally {
      setProcesando(false)
    }
  }

  // Separar por estado
  const enCamino = entregas.filter((e) => e.estado === 'EN_CAMINO')
  const entregados = entregas.filter((e) => e.estado === 'ENTREGADO')

  // ============================================
  // CARGANDO
  // ============================================
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-3" />
        <p>Cargando tus entregas...</p>
      </div>
    )
  }

  // ============================================
  // SIN ENTREGAS
  // ============================================
  if (entregas.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">¡Todo al día!</h2>
          <p className="text-muted-foreground mb-6">
            No tienes entregas pendientes asignadas
          </p>
          <Button variant="outline" onClick={handleRefresh} disabled={actualizando}>
            {actualizando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">En camino</p>
                  <p className="text-2xl font-bold">{enCamino.length}</p>
                </div>
                <Navigation className="h-8 w-8 text-cyan-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Entregados</p>
                  <p className="text-2xl font-bold">{entregados.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-2 md:col-span-1"
        >
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleRefresh}
                disabled={actualizando}
                variant="outline"
                className="w-full"
              >
                {actualizando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Actualizar lista
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Entregas en camino */}
      {enCamino.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5 text-cyan-600" />
            Por entregar ({enCamino.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enCamino.map((entrega, i) => (
              <motion.div
                key={entrega.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-all border-cyan-500/30"
                  onClick={() => abrirDetalle(entrega)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {entrega.numero}
                          <Badge className="bg-cyan-500 text-xs">En camino</Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entrega.enCaminoEn
                            ? tiempoTranscurrido(entrega.enCaminoEn)
                            : 'Recién asignado'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold text-primary">
                          {formatearMoneda(entrega.total)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm font-medium">
                        {entrega.clienteNombre}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{entrega.clienteTelefono}</span>
                    </div>
                    {entrega.clienteDireccion && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm line-clamp-2">
                          {entrega.clienteDireccion}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Package className="h-3 w-3" />
                        {entrega.cantidadItems} items
                      </Badge>
                      {entrega.zonaNombre && (
                        <Badge variant="outline" className="text-xs">
                          {entrega.zonaNombre}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Entregas completadas */}
      {entregados.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Entregados hoy ({entregados.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entregados.map((entrega) => (
              <Card
                key={entrega.id}
                className="cursor-pointer hover:shadow-md transition-all opacity-75"
                onClick={() => abrirDetalle(entrega)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium">
                      {entrega.numero}
                    </span>
                    <Badge className="bg-green-600 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Entregado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {entrega.clienteNombre}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entrega.entregadoEn
                      ? formatearFecha(entrega.entregadoEn)
                      : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de detalle */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          {cargandoDetalle ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entregaDetalle ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {entregaDetalle.numero}
                  <Badge
                    className={
                      entregaDetalle.estado === 'EN_CAMINO'
                        ? 'bg-cyan-500'
                        : 'bg-green-600'
                    }
                  >
                    {entregaDetalle.estado === 'EN_CAMINO'
                      ? 'En camino'
                      : 'Entregado'}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Creado el {formatearFecha(entregaDetalle.creadoEn)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Cliente */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="font-medium">
                        {entregaDetalle.clienteNombre}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <a
                        href={`tel:${entregaDetalle.clienteTelefono}`}
                        className="text-primary hover:underline"
                      >
                        {entregaDetalle.clienteTelefono}
                      </a>
                    </div>
                    {entregaDetalle.clienteDireccion && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{entregaDetalle.clienteDireccion}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Mapa */}
                {entregaDetalle.latitud &&
                entregaDetalle.longitud &&
                entregaDetalle.latitudNegocio &&
                entregaDetalle.longitudNegocio ? (
                <div className="space-y-2">
                    <MapaRutaRealWrapper
                    latitudOrigen={entregaDetalle.latitudNegocio}
                    longitudOrigen={entregaDetalle.longitudNegocio}
                    latitudDestino={entregaDetalle.latitud}
                    longitudDestino={entregaDetalle.longitud}
                    nombreOrigen="Momoto Café"
                    nombreDestino={entregaDetalle.clienteNombre}
                    altura="300px"
                    />
                    <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                    >
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${entregaDetalle.latitudNegocio},${entregaDetalle.longitudNegocio}&destination=${entregaDetalle.latitud},${entregaDetalle.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Navigation className="mr-2 h-4 w-4" />
                        Abrir en Google Maps (navegación)
                    </a>
                    </Button>
                </div>
                ) : (
                <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
                    <CardContent className="pt-6 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium text-sm text-amber-900 dark:text-amber-200">
                        Sin coordenadas en el pedido
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                        Este pedido fue creado sin ubicación en el mapa. Contacta al cajero
                        o administrador para que actualice la dirección.
                        </p>
                        {entregaDetalle.clienteDireccion && (
                        <p className="text-xs text-amber-900 dark:text-amber-200 mt-2 font-medium">
                            Dirección: {entregaDetalle.clienteDireccion}
                        </p>
                        )}
                    </div>
                    </CardContent>
                </Card>
                )}

                {/* Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Productos ({entregaDetalle.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {entregaDetalle.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between text-sm border-b pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {item.cantidad}x {item.nombreProducto}
                          </p>
                          {item.nombreVariante && (
                            <p className="text-xs text-muted-foreground">
                              {item.nombreVariante}
                            </p>
                          )}
                          {item.notas && (
                            <p className="text-xs text-muted-foreground italic">
                              "{item.notas}"
                            </p>
                          )}
                        </div>
                        <span className="font-medium">
                          {formatearMoneda(item.total)}
                        </span>
                      </div>
                    ))}

                    <Separator className="my-2" />

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatearMoneda(entregaDetalle.subtotal)}</span>
                    </div>
                    {entregaDetalle.costoEnvio > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Envío</span>
                        <span>
                          {formatearMoneda(entregaDetalle.costoEnvio)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>TOTAL A COBRAR</span>
                      <span className="text-primary text-lg">
                        {formatearMoneda(entregaDetalle.total)}
                      </span>
                    </div>

                    {entregaDetalle.estadoPago === 'PENDIENTE' && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 flex items-start gap-2 mt-2">
                        <DollarSign className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                            Cobrar al entregar
                          </p>
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            El cliente debe pagar{' '}
                            {formatearMoneda(entregaDetalle.total)} al recibir
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notas */}
                {entregaDetalle.notasInternas && (
                  <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
                    <CardContent className="pt-4">
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                        Nota interna:
                      </p>
                      <p className="text-sm italic">
                        "{entregaDetalle.notasInternas}"
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Botón entregar */}
                {entregaDetalle.estado === 'EN_CAMINO' && (
                  <Button
                    onClick={() => marcarEntregado(entregaDetalle.id)}
                    disabled={procesando}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {procesando ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Marcar como Entregado
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}