'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Printer, Ban } from 'lucide-react'

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

export type FacturaRow = {
  id: string
  numeroCompleto: string
  serie: string
  numero: number
  tipoDocumento: string
  estado: string
  clienteNombre: string
  clienteRuc: string | null
  fecha: string
  hora: string
  fechaISO: string
  subtotal: number
  iva: number
  total: number
  sucursalNombre: string
  cajeroNombre: string
  ventaNumero: string
  ventaId: string
  anuladaEn: string | null
  motivoAnulacion: string | null
  tieneNotaCredito: boolean
  notaCreditoNumero: string | null
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

const LABEL_TIPO: Record<string, string> = {
  FACTURA: 'Factura',
  CONSUMIDOR_FINAL: 'Consumidor Final',
  NOTA_CREDITO: 'Nota de Crédito',
  NOTA_DEBITO: 'Nota de Débito',
}

export const columnas: ColumnDef<FacturaRow, any>[] = [
  {
    accessorKey: 'numeroCompleto',
    header: 'Factura',
    cell: ({ row }) => (
      <div>
        <p className="font-mono font-semibold text-sm">
          {row.original.numeroCompleto}
        </p>
        <p className="text-xs text-muted-foreground">
          Venta: {row.original.ventaNumero}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'clienteNombre',
    header: 'Cliente',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.clienteNombre}</p>
        {row.original.clienteRuc && (
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.clienteRuc}
          </p>
        )}
      </div>
    ),
  },
  {
    id: 'fecha',
    accessorFn: (row) => row.fechaISO,
    header: 'Fecha',
    cell: ({ row }) => (
      <div className="text-sm">
        <p>{row.original.fecha}</p>
        <p className="text-xs text-muted-foreground">{row.original.hora}</p>
      </div>
    ),
  },
  {
    accessorKey: 'tipoDocumento',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {LABEL_TIPO[row.original.tipoDocumento] ?? row.original.tipoDocumento}
      </Badge>
    ),
    filterFn: (row, id, value) => row.original.tipoDocumento === value,
  },
  {
    accessorKey: 'sucursalNombre',
    header: 'Sucursal',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.sucursalNombre}</span>
    ),
  },
  {
    accessorKey: 'subtotal',
    header: 'Subtotal',
    cell: ({ row }) => (
      <span className="text-sm">{formatearMoneda(row.original.subtotal)}</span>
    ),
  },
  {
    accessorKey: 'iva',
    header: 'IVA',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatearMoneda(row.original.iva)}
      </span>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <span
        className={`font-bold ${
          row.original.estado === 'ANULADA'
            ? 'text-muted-foreground line-through'
            : 'text-primary'
        }`}
      >
        {formatearMoneda(row.original.total)}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const f = row.original
      if (f.estado === 'ANULADA') {
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="destructive" className="text-xs">
              ANULADA
            </Badge>
            {f.tieneNotaCredito && (
              <Badge variant="outline" className="text-xs">
                NC: {f.notaCreditoNumero}
              </Badge>
            )}
          </div>
        )
      }
      return (
        <Badge variant="default" className="bg-green-600 text-xs">
          EMITIDA
        </Badge>
      )
    },
    filterFn: (row, id, value) => row.original.estado === value,
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const factura = row.original
      const meta = table.options.meta as {
        onVerDetalle?: (f: FacturaRow) => void
      }

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
            <DropdownMenuItem onClick={() => meta.onVerDetalle?.(factura)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta.onVerDetalle?.(factura)}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </DropdownMenuItem>
            {factura.estado === 'ANULADA' && factura.motivoAnulacion && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-xs">
                  <Ban className="mr-2 h-3 w-3" />
                  {factura.motivoAnulacion.slice(0, 40)}
                  {factura.motivoAnulacion.length > 40 && '...'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]