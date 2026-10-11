'use client'

import * as React from 'react'
import {
  X,
  Phone,
  Mail,
  MapPin,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Banknote,
  Building2,
  Calendar,
  User,
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
import { getClienteCreditoDetalle } from './detalle-actions'

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

const LABEL_METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
}

export function DetalleClienteDialog({
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
    getClienteCreditoDetalle(clienteId)
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

  const nombreCompleto = cliente.nombreComercial || cliente.nombre
  const puedeAbonar = cliente.saldoActual > 0.01

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[95vw] w-[95vw] h-[92vh] !p-0 overflow-hidden flex flex-col gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold">
              {nombreCompleto}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {cliente.codigo}
              {cliente.numeroDocumento && (
                <> · {cliente.tipoDocumento}: {cliente.numeroDocumento}</>
              )}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {puedeAbonar && (
              <Button onClick={() => onAbono?.(cliente)} size="lg">
                <Wallet className="mr-2 h-4 w-4" />
                Registrar abono
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cards resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatearMoneda(cliente.saldoActual)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">
                  Crédito disponible
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatearMoneda(cliente.creditoDisponible)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {formatearMoneda(cliente.limiteCredito)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Total comprado</p>
                <p className="text-xl font-bold">
                  {formatearMoneda(cliente.totalComprado)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cliente.cantidadCompras} compras
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Total pagado</p>
                <p className="text-xl font-bold text-green-600">
                  {formatearMoneda(cliente.totalPagado)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cliente.cantidadPagos} abonos
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
            </CardContent>
          </Card>

          {/* Historial de abonos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                Historial de abonos ({cliente.pagos.length})
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
                    {cliente.pagos.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground h-20"
                        >
                          No hay abonos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      cliente.pagos.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">
                            {formatearFecha(p.fecha)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs gap-1">
                              {p.metodo === 'EFECTIVO' && (
                                <Banknote className="h-3 w-3" />
                              )}
                              {p.metodo === 'TRANSFERENCIA' && (
                                <Building2 className="h-3 w-3" />
                              )}
                              {p.metodo === 'TARJETA' && (
                                <CreditCard className="h-3 w-3" />
                              )}
                              {LABEL_METODO[p.metodo] ?? p.metodo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {p.referencia ?? '—'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            - {formatearMoneda(p.monto)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatearMoneda(p.saldoNuevo)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Historial de compras a crédito */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-destructive" />
                Compras a crédito ({cliente.ventas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Venta</TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Cajero</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cliente.ventas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground h-20"
                        >
                          No hay compras a crédito
                        </TableCell>
                      </TableRow>
                    ) : (
                      cliente.ventas.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-xs">
                            {formatearFecha(v.fecha)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {v.numero}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {v.facturaNumero ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {v.cajero}
                          </TableCell>
                          <TableCell className="text-right font-bold text-destructive">
                            + {formatearMoneda(v.total)}
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