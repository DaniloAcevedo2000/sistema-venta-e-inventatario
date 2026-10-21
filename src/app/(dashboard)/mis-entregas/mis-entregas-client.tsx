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
  Navigation,
  DollarSign,
  AlertCircle,
  Copy,
  ExternalLink,
  Flame,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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

type EntregaDetalle = Entrega & {
  tipo: string
  subtotal: number
  descuento: number
  impuesto: number
  estadoPago: string
  items: Array<{
    id: string
    nombreProducto: string
    nombreVariante: string | null
    cantidad: number
    precioUnitario: number
    total: number
    notas: string | null
  }>
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

function getUrgencia(fechaISO: string | null): {
  nivel: 'ok' | 'warn' | 'danger'
  label: string
  className: string
  iconClass: string
} {
  if (!fechaISO) {
    return {
      nivel: 'ok',
      label: 'Recién asignado',
      className:
        'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
      iconClass: 'text-cyan-600',
    }
  }

  const minutos = Math.floor(
    (new Date().getTime() - new Date(fechaISO).getTime()) / 60000
  )

  if (minutos < 15) {
    return {
      nivel: 'ok',
      label: `${minutos} min`,
      className:
        'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
      iconClass: 'text-green-600',
    }
  }
  if (minutos < 30) {
    return {
      nivel: 'warn',
      label: `${minutos} min`,
      className:
        'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      iconClass: 'text-amber-600',
    }
  }
  return {
    nivel: 'danger',
    label: `${minutos} min`,
    className:
      'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    iconClass: 'text-red-600',
  }
}

export function MisEntregasClient({ permisos }: Props) {
  const [entregas, setEntregas] = React.useState<Entrega[]>([])
  const [cargando, setCargando] = React.useState(true)
  const [actualizando, setActualizando] = React.useState(false)
  const [detalleOpen, setDetalleOpen] = React.useState(false)
  const [entregaDetalle, setEntregaDetalle] =
    React.useState<EntregaDetalle | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = React.useState(false)
  const [procesando, setProcesando] = React.useState(false)

  const cargarEntregas = React.useCallback(async (silencioso = false) => {
    if (!silencioso) setActualizando(true)
    try {
      const data = await getMisEntregas()
      setEntregas(data)
    } catch (err: any) {
      if (!silencioso) toast.error(err.message)
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }, [])

  React.useEffect(() => {
    cargarEntregas()
    const interval = setInterval(() => cargarEntregas(true), 20000)
    return () => clearInterval(interval)
  }, [cargarEntregas])

  const abrirDetalle = async (entrega: Entrega) => {
    setDetalleOpen(true)
    setCargandoDetalle(true)
    setEntregaDetalle(null)
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

  const copiarDireccion = (direccion: string) => {
    navigator.clipboard.writeText(direccion)
    toast.success('Dirección copiada')
  }

  const enCamino = entregas.filter((e) => e.estado === 'EN_CAMINO')
  const entregados = entregas.filter((e) => e.estado === 'ENTREGADO')

  const totales = React.useMemo(() => {
    return {
      enCamino: enCamino.length,
      entregados: entregados.length,
      montoPorCobrar: enCamino.reduce((s, e) => s + e.total, 0),
    }
  }, [enCamino, entregados])

  // ============================================
  // CARGANDO
  // ============================================
  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  // ============================================
  // SIN ENTREGAS
  // ============================================
  if (entregas.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-20 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/30 dark:to-green-900/10 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">¡Todo al día!</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            No tienes entregas pendientes. Te avisaremos cuando te asignen una
            nueva.
          </p>
          <Button
            variant="outline"
            onClick={() => cargarEntregas()}
            disabled={actualizando}
          >
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
      {/* ============================================
          STATS
          ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    En camino
                  </p>
                  <p className="text-3xl font-bold mt-1">{totales.enCamino}</p>
                </div>
                <div className="rounded-full bg-cyan-500/10 p-3">
                  <Navigation className="h-6 w-6 text-cyan-600" />
                </div>
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
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Entregados
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {totales.entregados}
                  </p>
                </div>
                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
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
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Por cobrar
                  </p>
                  <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
                    {formatearMoneda(totales.montoPorCobrar)}
                  </p>
                </div>
                <div className="rounded-full bg-amber-500/10 p-3">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ============================================
          EN CAMINO
          ============================================ */}
      {enCamino.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-cyan-600" />
              Por entregar
              <Badge variant="secondary" className="ml-1">
                {enCamino.length}
              </Badge>
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cargarEntregas()}
              disabled={actualizando}
            >
              {actualizando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enCamino.map((entrega, i) => {
              const urgencia = getUrgencia(entrega.enCaminoEn)
              return (
                <motion.div
                  key={entrega.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className={`
                      cursor-pointer hover:shadow-lg transition-all border-l-4
                      ${
                        urgencia.nivel === 'danger'
                          ? 'border-l-red-500 border-red-500/30'
                          : urgencia.nivel === 'warn'
                            ? 'border-l-amber-500 border-amber-500/30'
                            : 'border-l-cyan-500 border-cyan-500/30'
                      }
                    `}
                    onClick={() => abrirDetalle(entrega)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base font-mono">
                              {entrega.numero}
                            </CardTitle>
                            {urgencia.nivel === 'danger' && (
                              <Badge className="bg-red-600 gap-1 text-xs">
                                <Flame className="h-3 w-3" />
                                Urgente
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className={`h-3 w-3 ${urgencia.iconClass}`} />
                            En camino{' '}
                            {tiempoTranscurrido(entrega.enCaminoEn ?? '')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold text-primary text-lg">
                            {formatearMoneda(entrega.total)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {entrega.clienteNombre}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a
                          href={`tel:${entrega.clienteTelefono}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-primary hover:underline"
                        >
                          {entrega.clienteTelefono}
                        </a>
                      </div>

                      {entrega.clienteDireccion && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-sm line-clamp-2">
                            {entrega.clienteDireccion}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Package className="h-3 w-3" />
                          {entrega.cantidadItems} items
                        </Badge>
                        {entrega.zonaNombre && (
                          <Badge variant="outline" className="text-xs">
                            {entrega.zonaNombre}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${urgencia.className}`}>
                          {urgencia.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================
          ENTREGADOS HOY
          ============================================ */}
      {entregados.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Entregados hoy
            <Badge variant="secondary" className="ml-1">
              {entregados.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {entregados.map((entrega) => (
              <Card
                key={entrega.id}
                className="cursor-pointer hover:shadow-md transition-all opacity-70 hover:opacity-100"
                onClick={() => abrirDetalle(entrega)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-medium">
                      {entrega.numero}
                    </span>
                    <Badge className="bg-green-600 text-xs gap-1 h-5">
                      <CheckCircle2 className="h-3 w-3" />
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {entrega.clienteNombre}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
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

      {/* ============================================
          DIALOG DE DETALLE — ANCHO, MAPA GRANDE
          ============================================ */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent
          className="!max-w-4xl w-[95vw] lg:w-[1100px] max-h-[95vh] !p-0 overflow-hidden flex flex-col gap-0"
          showCloseButton={false}
        >
          {cargandoDetalle ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : entregaDetalle ? (
            <>
              {/* ============================================
                  HEADER — COMPACTO Y CLARO
                  ============================================ */}
              <div className="px-6 py-4 border-b bg-card flex items-center justify-between gap-4 flex-shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-bold font-mono">
                      {entregaDetalle.numero}
                    </DialogTitle>
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
                  </div>
                  <DialogDescription className="text-xs mt-1">
                    Creado el {formatearFecha(entregaDetalle.creadoEn)}
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Total a cobrar
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatearMoneda(entregaDetalle.total)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDetalleOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* ============================================
                  CONTENIDO SCROLLEABLE
                  ============================================ */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Acciones rápidas */}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" asChild>
                    <a href={`tel:${entregaDetalle.clienteTelefono}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Llamar
                    </a>
                  </Button>
                  {entregaDetalle.clienteDireccion && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        copiarDireccion(entregaDetalle.clienteDireccion!)
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar dirección
                    </Button>
                  )}
                  {entregaDetalle.latitud && entregaDetalle.longitud && (
                    <Button variant="outline" asChild>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${entregaDetalle.latitud},${entregaDetalle.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Maps
                      </a>
                    </Button>
                  )}
                </div>

                {/* ============================================
                    MAPA GRANDE
                    ============================================ */}
                {entregaDetalle.latitud &&
                entregaDetalle.longitud &&
                entregaDetalle.latitudNegocio !== 0 &&
                entregaDetalle.longitudNegocio !== 0 ? (
                  <div className="space-y-3">
                    <MapaRutaRealWrapper
                      latitudOrigen={entregaDetalle.latitudNegocio}
                      longitudOrigen={entregaDetalle.longitudNegocio}
                      latitudDestino={entregaDetalle.latitud}
                      longitudDestino={entregaDetalle.longitud}
                      nombreOrigen="Momoto Café"
                      nombreDestino={entregaDetalle.clienteNombre}
                      altura="500px"
                    />
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full bg-cyan-600 hover:bg-cyan-700 h-12 text-base"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${entregaDetalle.latitudNegocio},${entregaDetalle.longitudNegocio}&destination=${entregaDetalle.latitud},${entregaDetalle.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="mr-2 h-5 w-5" />
                        Abrir navegación paso a paso en Google Maps
                      </a>
                    </Button>
                  </div>
                ) : (
                  <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
                    <CardContent className="pt-5 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-200">
                          Sin coordenadas para el mapa
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                          Este pedido no tiene ubicación en el mapa. Usa la
                          dirección de texto o pide al cajero que la actualice.
                        </p>
                        {entregaDetalle.clienteDireccion && (
                          <div className="mt-3 p-2 rounded bg-amber-100/50 dark:bg-amber-950/30">
                            <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                              Dirección:
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                              {entregaDetalle.clienteDireccion}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Grid de cliente + productos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Cliente */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="font-medium">
                          {entregaDetalle.clienteNombre}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <a
                          href={`tel:${entregaDetalle.clienteTelefono}`}
                          className="text-primary hover:underline"
                        >
                          {entregaDetalle.clienteTelefono}
                        </a>
                      </div>
                      {entregaDetalle.clienteDireccion && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span>{entregaDetalle.clienteDireccion}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Productos */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        Productos ({entregaDetalle.items.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {entregaDetalle.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between text-sm border-b pb-2 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
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
                          <span className="font-medium shrink-0 ml-2">
                            {formatearMoneda(item.total)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Totales */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatearMoneda(entregaDetalle.subtotal)}</span>
                    </div>
                    {entregaDetalle.descuento > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Descuento</span>
                        <span>
                          - {formatearMoneda(entregaDetalle.descuento)}
                        </span>
                      </div>
                    )}
                    {entregaDetalle.costoEnvio > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Envío</span>
                        <span>
                          {formatearMoneda(entregaDetalle.costoEnvio)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL A COBRAR</span>
                      <span className="text-primary text-2xl">
                        {formatearMoneda(entregaDetalle.total)}
                      </span>
                    </div>

                    {entregaDetalle.estadoPago === 'PENDIENTE' && (
                      <div className="rounded-lg bg-amber-100/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 p-3 flex items-start gap-2 mt-2">
                        <DollarSign className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                            Cobrar al entregar
                          </p>
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            El cliente debe pagar{' '}
                            {formatearMoneda(entregaDetalle.total)} en el
                            momento de la entrega.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notas internas */}
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
              </div>

              {/* ============================================
                  FOOTER STICKY
                  ============================================ */}
              {entregaDetalle.estado === 'EN_CAMINO' && (
                <div className="border-t bg-card p-4 flex-shrink-0">
                  <Button
                    onClick={() => marcarEntregado(entregaDetalle.id)}
                    disabled={procesando}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                  >
                    {procesando ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Marcar como Entregado
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}