'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Truck, Ban } from 'lucide-react'

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

export type PedidoRow = {
  id: string
  numero: string
  tipo: 'DELIVERY' | 'PICKUP'
  estado: string
  clienteNombre: string
  clienteTelefono: string
  clienteDireccion: string | null
  zonaNombre: string | null
  sucursalNombre: string
  repartidorNombre: string | null
  fecha: string
  hora: string
  fechaISO: string
  total: number
  costoEnvio: number
  cantidadItems: number
  estadoPago: string
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
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

export const columnas: ColumnDef<PedidoRow, any>[] = [
  {
    accessorKey: 'numero',
    header: 'Pedido',
    cell: ({ row }) => (
      <div>
        <p className="font-mono font-semibold text-sm">
          {row.original.numero}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.original.cantidadItems} item
          {row.original.cantidadItems !== 1 ? 's' : ''}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge
        variant={row.original.tipo === 'DELIVERY' ? 'default' : 'secondary'}
        className={row.original.tipo === 'DELIVERY' ? 'bg-cyan-600' : ''}
      >
        {row.original.tipo === 'DELIVERY' ? '🛵 Delivery' : '🏪 Pickup'}
      </Badge>
    ),
    filterFn: (row, id, value) => row.original.tipo === value,
  },
  {
    accessorKey: 'clienteNombre',
    header: 'Cliente',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.clienteNombre}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.clienteTelefono}
        </p>
        {row.original.tipo === 'DELIVERY' && row.original.zonaNombre && (
          <p className="text-xs text-muted-foreground">
            📍 {row.original.zonaNombre}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const config = LABEL_ESTADO[row.original.estado] ?? {
        label: row.original.estado,
        color: 'bg-zinc-500',
      }
      return (
        <Badge className={config.color}>{config.label}</Badge>
      )
    },
    filterFn: (row, id, value) => row.original.estado === value,
  },
  {
    accessorKey: 'repartidorNombre',
    header: 'Repartidor',
    cell: ({ row }) => {
      if (row.original.tipo !== 'DELIVERY') {
        return <span className="text-xs text-muted-foreground">—</span>
      }
      if (!row.original.repartidorNombre) {
        return (
          <Badge variant="outline" className="text-xs">
            Sin asignar
          </Badge>
        )
      }
      return (
        <span className="text-sm">{row.original.repartidorNombre}</span>
      )
    },
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
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <div>
        <p
          className={`font-bold ${
            row.original.estado === 'CANCELADO'
              ? 'text-muted-foreground line-through'
              : 'text-primary'
          }`}
        >
          {formatearMoneda(row.original.total)}
        </p>
        {row.original.costoEnvio > 0 && (
          <p className="text-xs text-muted-foreground">
            Envío: {formatearMoneda(row.original.costoEnvio)}
          </p>
        )}
      </div>
    ),
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const pedido = row.original
      const meta = table.options.meta as {
        onVerDetalle?: (p: PedidoRow) => void
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
            <DropdownMenuItem onClick={() => meta.onVerDetalle?.(pedido)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]