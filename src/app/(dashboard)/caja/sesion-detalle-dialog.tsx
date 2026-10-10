'use client'

import * as React from 'react'
import { getSesionDetalle } from './sesion-actions'
import { toast } from 'sonner'
import {
  X,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  Banknote,
  Building2,
  CreditCard,
  Clock,
  Wallet,
  Landmark,
  Info,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MovimientoManualDialog } from './movimiento-manual-dialog'
import { VentaDetalleDialog } from '../ventas/venta-detalle-dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sesionId: string | null
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

export function SesionDetalleDialog({ open, onOpenChange, sesionId }: Props) {
  const [sesion, setSesion] = React.useState<any>(null)
  const [cargando, setCargando] = React.useState(false)
  const [movimientoOpen, setMovimientoOpen] = React.useState(false)
  const [ventaDetalle, setVentaDetalle] = React.useState<any>(null)

  const cargarSesion = React.useCallback(() => {
    if (!sesionId) return
    setCargando(true)
    getSesionDetalle(sesionId)
      .then((data) => setSesion(data))
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }, [sesionId])

  React.useEffect(() => {
    if (!open || !sesionId) return
    cargarSesion()
  }, [open, sesionId, cargarSesion])

  if (!sesion) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center h-32">
            {cargando ? 'Cargando...' : 'Sin datos'}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const puedeAgregarMovimiento = sesion.estado === 'ABIERTA'
  const estaCerrada = sesion.estado === 'CERRADA'

  // Efectivo esperado en caja física
  const efectivoEsperado =
    sesion.montoInicial +
    sesion.totalEfectivo +
    (sesion.totalIngresos || 0) -
    (sesion.totalEgresos || 0)

  // Total del turno (fondo + todas las ventas)
  const totalTurno = sesion.montoInicial + sesion.totalVentas

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] w-[95vw] h-[92vh] !p-0 overflow-hidden flex flex-col gap-0">
          {/* ============================================
              HEADER
              ============================================ */}
          <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <DialogTitle className="text-xl font-bold">
                Sesión de {sesion.cajaNombre}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {sesion.cajero} · Apertura: {formatearFecha(sesion.fechaApertura)}
                {sesion.fechaCierre && (
                  <> · Cierre: {formatearFecha(sesion.fechaCierre)}</>
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {sesion.estado === 'ABIERTA' ? (
                <Badge className="bg-green-600">Abierta</Badge>
              ) : (
                <Badge variant="outline">Cerrada</Badge>
              )}
              {puedeAgregarMovimiento && (
                <Button size="sm" onClick={() => setMovimientoOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Movimiento manual
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* ============================================
              CONTENIDO
              ============================================ */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ============================================
                CARDS RESUMEN
                ============================================ */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Monto Inicial */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Monto Inicial
                    </p>
                  </div>
                  <p className="text-xl font-bold">
                    C$ {sesion.montoInicial.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Base del turno
                  </p>
                </CardContent>
              </Card>

              {/* Total Ventas */}
              <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    <p className="text-xs text-muted-foreground">
                      Total Ventas
                    </p>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    C$ {sesion.totalVentas.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {sesion.cantidadVentasCompletadas ?? 0} ventas
                    {sesion.cantidadVentasAnuladas > 0 && (
                      <> · {sesion.cantidadVentasAnuladas} anuladas</>
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Efectivo cobrado */}
              <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-xs text-muted-foreground">
                      Efectivo cobrado
                    </p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    C$ {sesion.totalEfectivo.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Va a la caja
                  </p>
                </CardContent>
              </Card>

              {/* Efectivo esperado en caja */}
              <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-3.5 w-3.5 text-blue-600" />
                    <p className="text-xs text-muted-foreground">
                      {estaCerrada ? 'Efectivo en caja' : 'Efectivo esperado'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    C${' '}
                    {estaCerrada && sesion.montoFinal !== null
                      ? sesion.montoFinal.toFixed(2)
                      : efectivoEsperado.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {estaCerrada
                      ? 'Contado al cierre'
                      : `C$ ${sesion.montoInicial.toFixed(2)} + C$ ${sesion.totalEfectivo.toFixed(2)}`}
                  </p>
                </CardContent>
              </Card>

              {/* Diferencia / Total del turno */}
              {estaCerrada ? (
                <Card
                  className={
                    sesion.diferencia !== null &&
                    Math.abs(sesion.diferencia) > 0.01
                      ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10'
                      : 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10'
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Diferencia
                      </p>
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        sesion.diferencia === null
                          ? 'text-muted-foreground'
                          : Math.abs(sesion.diferencia) < 0.01
                            ? 'text-green-600'
                            : sesion.diferencia > 0
                              ? 'text-amber-600'
                              : 'text-red-600'
                      }`}
                    >
                      {sesion.diferencia === null
                        ? '—'
                        : `C$ ${sesion.diferencia.toFixed(2)}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {sesion.diferencia !== null &&
                      Math.abs(sesion.diferencia) < 0.01
                        ? 'Cuadra ✓'
                        : sesion.diferencia !== null && sesion.diferencia > 0
                          ? 'Sobrante'
                          : sesion.diferencia !== null &&
                              sesion.diferencia < 0
                            ? 'Faltante'
                            : 'Sin arqueo'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                      <p className="text-xs text-muted-foreground">
                        Total del turno
                      </p>
                    </div>
                    <p className="text-xl font-bold text-purple-600">
                      C$ {totalTurno.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Fondo + Ventas
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Alerta de diferencia */}
            {estaCerrada &&
              sesion.diferencia !== null &&
              Math.abs(sesion.diferencia) > 0.01 && (
                <div
                  className={`rounded-lg border p-4 flex items-start gap-3 ${
                    sesion.diferencia > 0
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                  }`}
                >
                  <TrendingDown
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      sesion.diferencia > 0 ? 'text-amber-600' : 'text-red-600'
                    }`}
                  />
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        sesion.diferencia > 0
                          ? 'text-amber-900 dark:text-amber-200'
                          : 'text-red-900 dark:text-red-200'
                      }`}
                    >
                      {sesion.diferencia > 0
                        ? 'Sobrante en caja'
                        : 'Faltante en caja'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Esperado: C$ {sesion.montoEsperado?.toFixed(2)} · Contado:
                      C$ {sesion.montoFinal?.toFixed(2)} · Diferencia: C${' '}
                      {sesion.diferencia.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

            {/* ============================================
                DESGLOSE: ¿A DÓNDE VA EL DINERO?
                ============================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Desglose del dinero
                  {sesion.estado === 'ABIERTA' && (
                    <span className="text-xs font-normal text-muted-foreground">
                      (en tiempo real)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Efectivo */}
                <div className="flex items-center justify-between rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 p-2">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Efectivo</p>
                      <p className="text-xs text-muted-foreground">
                        Va físicamente a la caja
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-600">
                    C$ {sesion.totalEfectivo.toFixed(2)}
                  </p>
                </div>

                {/* Tarjeta */}
                <div className="flex items-center justify-between rounded-lg border bg-blue-50/50 dark:bg-blue-950/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tarjeta</p>
                      <p className="text-xs text-muted-foreground">
                        Va a la cuenta bancaria (POS)
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-blue-600">
                    C$ {sesion.totalTarjeta.toFixed(2)}
                  </p>
                </div>

                {/* Transferencia */}
                <div className="flex items-center justify-between rounded-lg border bg-purple-50/50 dark:bg-purple-950/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 dark:bg-purple-900/40 p-2">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Transferencia</p>
                      <p className="text-xs text-muted-foreground">
                        Ya está en la cuenta bancaria
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-purple-600">
                    C$ {sesion.totalTransferencia.toFixed(2)}
                  </p>
                </div>

                {/* Desglose extendido */}
                {(sesion.totalIngresos > 0 ||
                  sesion.totalEgresos > 0 ||
                  sesion.totalAnulado > 0) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {sesion.totalIngresos > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            Ingresos manuales
                          </div>
                          <p className="font-bold text-green-600 mt-1">
                            + C$ {sesion.totalIngresos.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {sesion.totalEgresos > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingDown className="h-3 w-3 text-red-600" />
                            Egresos manuales
                          </div>
                          <p className="font-bold text-red-600 mt-1">
                            - C$ {sesion.totalEgresos.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {sesion.totalAnulado > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <X className="h-3 w-3 text-destructive" />
                            Ventas anuladas
                          </div>
                          <p className="font-bold text-destructive mt-1">
                            - C$ {sesion.totalAnulado.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Total vendido en el turno</p>
                  <p className="text-lg font-bold text-primary">
                    C$ {sesion.totalVentas.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ============================================
                MOVIMIENTOS MANUALES
                ============================================ */}
            {sesion.movimientos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Movimientos manuales ({sesion.movimientos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sesion.movimientos.map((mov: any) => {
                          const esIngreso = mov.tipo === 'INGRESO'
                          return (
                            <TableRow key={mov.id}>
                              <TableCell>
                                <Badge
                                  variant={
                                    esIngreso ? 'default' : 'destructive'
                                  }
                                  className={esIngreso ? 'bg-green-600' : ''}
                                >
                                  {esIngreso ? (
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="mr-1 h-3 w-3" />
                                  )}
                                  {mov.tipo}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {mov.motivo}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {mov.usuarioNombre}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatearFecha(mov.creadoEn)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`font-medium ${
                                    esIngreso
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {esIngreso ? '+' : '-'}
                                  C$ {mov.monto.toFixed(2)}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ============================================
                VENTAS DE LA SESIÓN
                ============================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Ventas ({sesion.ventas.length})</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Total: C$ {sesion.totalVentas.toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Venta</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sesion.ventas.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground h-24"
                          >
                            No hay ventas en esta sesión
                          </TableCell>
                        </TableRow>
                      ) : (
                        sesion.ventas.map((v: any) => (
                          <TableRow
                            key={v.id}
                            className={
                              v.estado === 'ANULADA'
                                ? 'opacity-50 bg-red-50/30 dark:bg-red-950/10'
                                : ''
                            }
                          >
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center gap-2">
                                {v.numero}
                                {v.estado === 'ANULADA' && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    ANULADA
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.clienteNombre}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {v.metodoPago}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatearFecha(v.fechaISO)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <span
                                className={
                                  v.estado === 'ANULADA'
                                    ? 'line-through text-muted-foreground'
                                    : ''
                                }
                              >
                                C$ {v.total.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setVentaDetalle(v)}
                                title="Ver detalle"
                              >
                                <Eye className="h-3.5 w-3.5" />
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
          </div>
        </DialogContent>
      </Dialog>

      <MovimientoManualDialog
        open={movimientoOpen}
        onOpenChange={setMovimientoOpen}
        sesionId={sesionId!}
        onSuccess={cargarSesion}
      />

      <VentaDetalleDialog
        open={!!ventaDetalle}
        onOpenChange={(open) => !open && setVentaDetalle(null)}
        venta={ventaDetalle}
      />
    </>
  )
}