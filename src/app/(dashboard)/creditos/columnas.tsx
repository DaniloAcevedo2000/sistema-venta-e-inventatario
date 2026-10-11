'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  Phone,
  AlertTriangle,
} from 'lucide-react'

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

export type CreditoRow = {
  id: string
  codigo: string
  nombre: string
  nombreComercial: string | null
  telefono: string | null
  correo: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  limiteCredito: number
  saldoActual: number
  creditoDisponible: number
  porcentajeUsado: number
  cantidadComprasCredito: number
  ultimaCompra: string | null
  diasSinPagar: number | null
  estado: 'al_dia' | 'activo' | 'limite_alcanzado'
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export const columnas: ColumnDef<CreditoRow, any>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.codigo}</span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: 'Cliente',
    cell: ({ row }) => {
      const c = row.original
      const nombre = c.nombreComercial || c.nombre

      return (
        <div>
          <p className="font-medium text-sm">{nombre}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {c.numeroDocumento && (
              <span>
                {c.tipoDocumento}: {c.numeroDocumento}
              </span>
            )}
            {c.telefono && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {c.telefono}
                </span>
              </>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'saldoActual',
    header: 'Saldo Pendiente',
    cell: ({ row }) => (
      <div>
        <p className="font-bold text-destructive text-base">
          {formatearMoneda(row.original.saldoActual)}
        </p>
        <p className="text-xs text-muted-foreground">
          de {formatearMoneda(row.original.limiteCredito)}
        </p>
      </div>
    ),
  },
  {
    id: 'uso',
    header: 'Uso del crédito',
    cell: ({ row }) => {
      const pct = row.original.porcentajeUsado

      return (
        <div className="space-y-1 min-w-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{pct.toFixed(0)}%</span>
            {pct >= 100 && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>Límite alcanzado</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={
                pct >= 100
                  ? 'h-full bg-destructive'
                  : pct >= 75
                    ? 'h-full bg-amber-500'
                    : 'h-full bg-green-500'
              }
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Disp: {formatearMoneda(row.original.creditoDisponible)}
          </p>
        </div>
      )
    },
  },
  {
    id: 'compras',
    accessorFn: (row) => row.cantidadComprasCredito,
    header: 'Compras a crédito',
    cell: ({ row }) => (
      <div className="text-sm">
        <p className="font-medium">{row.original.cantidadComprasCredito}</p>
        {row.original.ultimaCompra && (
          <p className="text-xs text-muted-foreground">
            {row.original.ultimaCompra}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.original.estado

      if (estado === 'al_dia') {
        return (
          <Badge variant="default" className="bg-green-600">
            Al día
          </Badge>
        )
      }
      if (estado === 'limite_alcanzado') {
        return <Badge variant="destructive">Límite alcanzado</Badge>
      }
      return <Badge variant="secondary">Con saldo</Badge>
    },
    filterFn: (row, id, value) => row.original.estado === value,
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const cliente = row.original
      const meta = table.options.meta as {
        onVerDetalle?: (c: CreditoRow) => void
        onAbono?: (c: CreditoRow) => void
        permisos?: string[]
      }
      const permisos = meta.permisos ?? []
      const puedeGestionar = permisos.includes('creditos:gestionar')

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
            <DropdownMenuItem onClick={() => meta.onVerDetalle?.(cliente)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver historial
            </DropdownMenuItem>
            {puedeGestionar && cliente.saldoActual > 0.01 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => meta.onAbono?.(cliente)}
                  className="text-green-600 focus:text-green-600"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar abono
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]