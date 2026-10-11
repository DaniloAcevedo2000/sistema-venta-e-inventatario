'use client'

import * as React from 'react'
import * as Icons from 'lucide-react'
import { ArrowRight, AlertCircle, User, Check } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { usePosStore } from '@/lib/stores/pos-store'
import { crearVentaAction } from './actions'
import type {
  MetodoPagoConfig,
  BancoConfig,
  RedTarjetaConfig,
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
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: Usuario
  tasaCambio: number
  metodosPago: MetodoPagoConfig[]
  bancos: BancoConfig[]
  redesTarjeta: RedTarjetaConfig[]
  clientes: ClienteConfig[]
  sesionCajaId: string
  onVentaCreada?: (resultado: any) => void
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export function CobrarDialog({
  open,
  onOpenChange,
  usuario,
  tasaCambio,
  metodosPago,
  bancos,
  redesTarjeta,
  clientes,
  sesionCajaId,
  onVentaCreada,
}: Props) {
  const total = usePosStore((s) => s.total())
  const items = usePosStore((s) => s.items)
  const limpiar = usePosStore((s) => s.limpiar)

  const [metodoId, setMetodoId] = React.useState<string>('')
  const [montoRecibido, setMontoRecibido] = React.useState('')
  const [bancoId, setBancoId] = React.useState('')
  const [redId, setRedId] = React.useState('')
  const [referencia, setReferencia] = React.useState('')
  const [clienteId, setClienteId] = React.useState<string>('')
  const [clienteOpen, setClienteOpen] = React.useState(false)
  const [procesando, setProcesando] = React.useState(false)

  const metodo = metodosPago.find((m) => m.id === metodoId) || metodosPago[0]
  const cliente = clientes.find((c) => c.id === clienteId)

  // Auto-seleccionar primer método
  React.useEffect(() => {
    if (open && metodosPago.length > 0 && !metodoId) {
      setMetodoId(metodosPago[0].id)
    }
  }, [open, metodosPago, metodoId])

  // Limpiar al abrir
  React.useEffect(() => {
    if (open) {
      setMontoRecibido('')
      setBancoId('')
      setRedId('')
      setReferencia('')
      setClienteId('')
    }
  }, [open])

  if (!metodo) return null

  // ============================================
  // CÁLCULOS
  // ============================================
  const montoNum = parseFloat(montoRecibido) || 0
  const esEfectivoUsd = metodo.codigo === 'EFECTIVO_USD'
  const esEfectivo = metodo.tipo === 'efectivo'

  const totalEnMoneda = esEfectivoUsd ? total / tasaCambio : total
  const cambioEnMoneda = Math.max(0, montoNum - totalEnMoneda)
  const cambioEnNio = esEfectivoUsd ? cambioEnMoneda * tasaCambio : cambioEnMoneda

  const requiereMonto = esEfectivo
  const montoSuficiente = !requiereMonto || montoNum >= totalEnMoneda
  const bancoValido = !metodo.requiereBanco || bancoId !== ''
  const redValida = !metodo.requiereRed || redId !== ''

  // ============================================
  // VALIDACIÓN DE CRÉDITO
  // ============================================
  const creditoSuficiente = React.useMemo(() => {
    if (!metodo.esCredito) return true
    if (!cliente) return false
    return cliente.creditoDisponible >= total
  }, [metodo.esCredito, cliente, total])

  const creditoCliente = cliente
    ? {
        disponible: cliente.creditoDisponible,
        saldoActual: cliente.saldoActual,
        limite: cliente.limiteCredito,
        nuevoSaldo: cliente.saldoActual + total,
      }
    : null

  const puedeConfirmar =
    items.length > 0 &&
    montoSuficiente &&
    bancoValido &&
    redValida &&
    (!metodo.esCredito || (cliente && creditoSuficiente))

  // ============================================
  // HANDLER COBRAR
  // ============================================
  const handleCobrar = async () => {
    if (!puedeConfirmar) return

    setProcesando(true)
    try {
      const resultado = await crearVentaAction({
        items: items.map((i) => ({
          id: i.id,
          productoId: i.productoId,
          varianteId: i.varianteId,
          codigo: i.codigo,
          nombre: i.nombre,
          nombreVariante: i.nombreVariante,
          precioUnitario: i.precioUnitario,
          cantidad: i.cantidad,
          descuento: i.descuento,
          tipoImpuesto: i.tipoImpuesto,
          notas: i.notas,
        })),
        metodoPagoId: metodo.id,
        montoRecibido: montoNum,
        cambio: cambioEnMoneda,
        bancoId: bancoId || undefined,
        redTarjetaId: redId || undefined,
        referencia: referencia || undefined,
        tasaCambio,
        sesionCajaId,
        clienteId: clienteId || undefined,
      })

      if (!resultado.success) {
        toast.error(resultado.error || 'Error al procesar la venta')
        return
      }

      toast.success(`Venta ${resultado.venta?.numero} completada`)
      limpiar()
      onOpenChange(false)

      if (onVentaCreada && resultado.venta) {
        onVentaCreada(resultado.venta)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado al procesar el cobro')
    } finally {
      setProcesando(false)
    }
  }

  const nombreCliente = cliente
    ? cliente.nombreComercial ||
      `${cliente.nombre} ${cliente.apellido ?? ''}`.trim()
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cobrar Orden</DialogTitle>
          <DialogDescription>
            {items.length} {items.length === 1 ? 'item' : 'items'} · Tasa de
            cambio: C$ {tasaCambio.toFixed(4)} / USD
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ============================================
              SELECTOR DE CLIENTE (solo si es crédito)
              ============================================ */}
          {metodo.esCredito && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente <span className="text-destructive">*</span>
              </Label>

              <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-between font-normal h-auto py-3',
                      !cliente && 'text-muted-foreground'
                    )}
                    disabled={procesando}
                  >
                    {cliente ? (
                      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                        <span className="truncate font-medium">
                          {nombreCliente}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Disponible: {formatearMoneda(cliente.creditoDisponible)}
                        </span>
                      </div>
                    ) : (
                      'Buscar cliente con crédito...'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre, código, RUC..." />
                    <CommandList>
                      <CommandEmpty>
                        No hay clientes con crédito habilitado
                      </CommandEmpty>
                      <CommandGroup heading="Clientes con crédito">
                        {clientes.map((c) => {
                          const nombre =
                            c.nombreComercial ||
                            `${c.nombre} ${c.apellido ?? ''}`.trim()
                          const disponible = c.creditoDisponible
                          const suficiente = disponible >= total

                          return (
                            <CommandItem
                              key={c.id}
                              value={`${c.codigo} ${nombre} ${c.numeroDocumento ?? ''}`}
                              onSelect={() => {
                                setClienteId(c.id)
                                setClienteOpen(false)
                              }}
                              className="flex flex-col items-start py-2"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <Check
                                  className={cn(
                                    'h-4 w-4 shrink-0',
                                    clienteId === c.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                <span className="font-medium truncate flex-1">
                                  {nombre}
                                </span>
                                <Badge
                                  variant={
                                    suficiente ? 'secondary' : 'destructive'
                                  }
                                  className="text-xs shrink-0"
                                >
                                  {formatearMoneda(disponible)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 pl-6 mt-0.5">
                                <span className="text-xs text-muted-foreground font-mono">
                                  {c.codigo}
                                </span>
                                {c.numeroDocumento && (
                                  <>
                                    <span className="text-xs text-muted-foreground">
                                      ·
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {c.tipoDocumento}: {c.numeroDocumento}
                                    </span>
                                  </>
                                )}
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Detalle del crédito del cliente */}
              {cliente && creditoCliente && (
                <div
                  className={cn(
                    'rounded-lg border p-3 space-y-2 text-sm',
                    creditoSuficiente
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                  )}
                >
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Límite</span>
                    <span className="font-medium">
                      {formatearMoneda(creditoCliente.limite)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo actual</span>
                    <span className="font-medium">
                      {formatearMoneda(creditoCliente.saldoActual)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponible</span>
                    <span className="font-bold">
                      {formatearMoneda(creditoCliente.disponible)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Esta venta</span>
                    <span className="font-medium">{formatearMoneda(total)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Nuevo saldo</span>
                    <span
                      className={
                        creditoSuficiente
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatearMoneda(creditoCliente.nuevoSaldo)}
                    </span>
                  </div>
                  {!creditoSuficiente && (
                    <p className="text-xs text-red-600 pt-1">
                      ⚠️ El crédito disponible no es suficiente para esta venta
                    </p>
                  )}
                </div>
              )}

              {!cliente && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Selecciona un cliente con crédito habilitado para continuar
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Total */}
          <div className="rounded-lg bg-primary/10 p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Total a cobrar</p>
            <p className="text-4xl font-bold text-primary">
              C$ {total.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ USD ${(total / tasaCambio).toFixed(2)}
            </p>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <div className="grid grid-cols-3 gap-2">
              {metodosPago.map((m) => {
                const Icon = m.icono
                  ? (Icons[m.icono as keyof typeof Icons] as React.ComponentType<{ className?: string }>)
                  : Icons.CircleDollarSign
                const isActive = metodo.id === m.id
                return (
                  <Button
                    key={m.id}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col items-center gap-1"
                    onClick={() => {
                      setMetodoId(m.id)
                      if (!m.esCredito) setClienteId('')
                    }}
                    disabled={procesando}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{m.nombre}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Efectivo */}
          {requiereMonto && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="monto">
                  Monto recibido ({esEfectivoUsd ? 'USD' : 'C$'})
                </Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  placeholder={
                    esEfectivoUsd
                      ? (total / tasaCambio).toFixed(2)
                      : total.toFixed(2)
                  }
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="text-2xl h-14 text-center font-bold"
                  autoFocus
                  disabled={procesando}
                />
                {montoNum > 0 && !montoSuficiente && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    El monto es menor al total
                  </p>
                )}
              </div>

              {esEfectivoUsd && montoNum > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recibido USD</span>
                    <span className="font-medium">${montoNum.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Equivalente C$
                    </span>
                    <span className="font-medium">
                      C$ {(montoNum * tasaCambio).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {montoNum > 0 && montoSuficiente && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-center border border-green-200 dark:border-green-900 space-y-1">
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Cambio
                  </p>
                  {esEfectivoUsd ? (
                    <>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                        ${cambioEnMoneda.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500">
                        = C$ {cambioEnNio.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                      C$ {cambioEnMoneda.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Banco */}
          {metodo.requiereBanco && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">
                    Banco <span className="text-destructive">*</span>
                  </Label>
                  <Select value={bancoId} onValueChange={setBancoId} disabled={procesando}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancos.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {metodo.requiereRed && (
                  <div className="space-y-2">
                    <Label htmlFor="red">Red de la tarjeta</Label>
                    <Select value={redId} onValueChange={setRedId} disabled={procesando}>
                      <SelectTrigger>
                        <SelectValue placeholder="Visa, Mastercard..." />
                      </SelectTrigger>
                      <SelectContent>
                        {redesTarjeta.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {metodo.requiereReferencia && (
                  <div className="space-y-2">
                    <Label htmlFor="referencia">
                      Número de referencia / voucher
                    </Label>
                    <Input
                      id="referencia"
                      placeholder="Últimos 4 dígitos, código de autorización..."
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      disabled={procesando}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={procesando}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCobrar}
              disabled={procesando || !puedeConfirmar}
              className="flex-1 h-12"
              size="lg"
            >
              {procesando ? 'Procesando...' : `Cobrar C$ ${total.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}