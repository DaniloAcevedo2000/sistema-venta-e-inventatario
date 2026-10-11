'use client'

import * as React from 'react'
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getClienteDetalle } from './detalle-actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string | null
  onAbono?: (cliente: any) => void
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

export function ClienteDetalleDialog({
  open,
  onOpenChange,
  clienteId,
  onAbono,
}: Props) {
  const [cliente, setCliente] = React.useState<any>(null)
  const [cargando, setCargando] = React.useState(false)

  React.useEffect(() => {
    if (!open || !clienteId) return
    setCargando(true)
    getClienteDetalle(clienteId)
      .then(setCliente)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }, [open, clienteId])

  if (!cliente) {
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

  const nombreCompleto = cliente.nombreComercial
    ? cliente.nombreComercial
    : `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] w-[95vw] h-[92vh] !p-0 overflow-hidden flex flex-col gap-0"  showCloseButton={false}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {nombreCompleto}
              {!cliente.activo && <Badge variant="secondary">Inactivo</Badge>}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {cliente.codigo}
              {cliente.numeroDocumento && (
                <> · {cliente.tipoDocumento}: {cliente.numeroDocumento}</>
              )}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {cliente.saldoActual > 0.01 && (
              <Button onClick={() => onAbono?.(cliente)}>
                <Wallet className="mr-2 h-4 w-4" />
                Registrar abono
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Alerta de cliente inactivo con motivo */}
          {!cliente.activo && cliente.motivoCambio && (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-red-900 dark:text-red-200">
                    Cliente desactivado
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-300 mt-1 italic">
                    "{cliente.motivoCambio}"
                  </p>
                  {cliente.desactivadoEn && (
                    <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                      Desactivado el {formatearFecha(cliente.desactivadoEn)}
                      {cliente.desactivadoPorNombre && (
                        <> por {cliente.desactivadoPorNombre}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cards resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                <p
                  className={`text-xl font-bold ${
                    cliente.saldoActual > 0.01
                      ? 'text-destructive'
                      : 'text-green-600'
                  }`}
                >
                  {formatearMoneda(cliente.saldoActual)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cliente.saldoActual > 0.01 ? 'Por cobrar' : 'Al día ✓'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Límite de crédito</p>
                <p className="text-xl font-bold">
                  {cliente.permiteCredito
                    ? formatearMoneda(cliente.limiteCredito)
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cliente.permiteCredito ? 'Habilitado' : 'Sin crédito'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Ventas totales</p>
                <p className="text-xl font-bold">{cliente.cantidadVentas}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatearMoneda(cliente.totalVentas)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Crédito disponible</p>
                <p className="text-xl font-bold text-green-600">
                  {formatearMoneda(cliente.creditoDisponible)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Puede comprar hasta
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {cliente.telefono && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{cliente.telefono}</p>
                    </div>
                  </div>
                )}
                {cliente.correo && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Correo</p>
                      <p className="font-medium">{cliente.correo}</p>
                    </div>
                  </div>
                )}
                {cliente.direccion && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <p className="font-medium">{cliente.direccion}</p>
                    </div>
                  </div>
                )}
              </div>
              {cliente.notas && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm italic">{cliente.notas}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Historial de pagos */}
          {cliente.pagosCredito.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Pagos de crédito ({cliente.pagosCredito.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Saldo después</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cliente.pagosCredito.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">
                            {formatearFecha(p.fecha)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {p.metodo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {p.referencia ?? '—'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            + {formatearMoneda(p.monto)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatearMoneda(p.saldoNuevo)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de ventas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Historial de compras ({cliente.ventas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venta</TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cliente.ventas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground h-24"
                        >
                          Sin compras registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      cliente.ventas.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono text-xs">
                            {v.numero}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {v.facturaNumero ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatearFecha(v.fechaISO)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {v.metodoPago}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {v.estado === 'COMPLETADA' ? (
                              <Badge className="bg-green-600 text-xs">
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                ANULADA
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatearMoneda(v.total)}
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
  )
}