'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal,
  Eye,
  Printer,
  Ban,
  Receipt,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type VentaRow = {
  id: string
  numero: string
  facturaNumero: string | null
  facturaId: string | null
  fecha: string
  hora: string
  fechaISO: string
  clienteNombre: string
  cajeroNombre: string
  sucursalNombre: string
  metodoPago: string
  banco: string | null
  redTarjeta: string | null
  total: number
  estado: string
  tipo: string
  cantidadItems: number

  // Anulación
  anuladaEn: string | null
  anuladaPorNombre: string | null
  motivoAnulacion: string | null
  devueltaAlInventario: boolean
  montoDevuelto: number | null
  metodoDevolucion: string | null
  referenciaDevolucion: string | null

  // Nota de crédito
  notaCreditoNumero: string | null
  notaCreditoId: string | null
  notaCreditoTotal: number | null

  // Movimientos de inventario
  movimientosAnulacion: Array<{
    id: string
    tipo: string
    cantidad: number
    insumoNombre: string | null
    insumoCodigo: string | null
    unidadAbreviatura: string | null
    productoNombre: string | null
    productoCodigo: string | null
  }>
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export const columnas: ColumnDef<VentaRow, any>[] = [
  {
    accessorKey: 'numero',
    header: 'Venta',
    cell: ({ row }) => (
      <div>
        <div className="font-mono text-sm font-medium">{row.original.numero}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {row.original.facturaNumero ?? 'Sin factura'}
        </div>
      </div>
    ),
  },
  {
    id: 'fecha',
    accessorFn: (row) => row.fecha,
    header: 'Fecha',
    cell: ({ row }) => (
      <div>
        <div className="text-sm">{row.original.fecha}</div>
        <div className="text-xs text-muted-foreground">{row.original.hora}</div>
      </div>
    ),
  },
  {
    accessorKey: 'clienteNombre',
    header: 'Cliente',
    cell: ({ row }) => (
      <div className="max-w-[180px]">
        <div className="text-sm truncate">{row.original.clienteNombre}</div>
      </div>
    ),
  },
  {
    accessorKey: 'cajeroNombre',
    header: 'Cajero',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.cajeroNombre}
      </span>
    ),
  },
  {
    accessorKey: 'metodoPago',
    header: 'Pago',
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="text-xs w-fit">
          {row.original.metodoPago}
        </Badge>
        {row.original.banco && (
          <span className="text-xs text-muted-foreground">
            {row.original.banco}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'items',
    accessorFn: (row) => row.cantidadItems,
    header: 'Items',
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.original.cantidadItems}
      </Badge>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <span className="font-bold text-primary">
        {formatearMoneda(row.original.total)}
      </span>
    ),
  },
  {
  accessorKey: 'estado',
  header: 'Estado',
  cell: ({ row }) => {
    const estado = row.original.estado
    const motivo = row.original.motivoAnulacion
    const nc = row.original.notaCreditoNumero

    if (estado === 'COMPLETADA') {
      return (
        <Badge variant="default" className="bg-green-600 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completada
        </Badge>
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="gap-1 cursor-help">
            <XCircle className="h-3 w-3" />
            Anulada
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1 text-xs">
            {motivo && <p><strong>Motivo:</strong> {motivo}</p>}
            {row.original.anuladaPorNombre && (
              <p><strong>Anulada por:</strong> {row.original.anuladaPorNombre}</p>
            )}
            {nc && <p><strong>Nota de crédito:</strong> {nc}</p>}
            {row.original.devueltaAlInventario && (
              <p className="text-green-600">✓ Devuelto al inventario</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  },
  filterFn: (row, id, value) => row.original.estado === value,
},
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const venta = row.original
      const meta = table.options.meta as {
        onVerDetalle?: (venta: VentaRow) => void
        onImprimir?: (venta: VentaRow) => void
        onAnular?: (venta: VentaRow) => void
        permisos?: string[]
      }
      const permisos = meta.permisos ?? []
      const puedeAnular = permisos.includes('ventas:anular')

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta.onVerDetalle?.(venta)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            {venta.facturaId && (
              <DropdownMenuItem onClick={() => meta.onImprimir?.(venta)}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir factura
              </DropdownMenuItem>
            )}
            {puedeAnular && venta.estado === 'COMPLETADA' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => meta.onAnular?.(venta)}
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Anular venta
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]