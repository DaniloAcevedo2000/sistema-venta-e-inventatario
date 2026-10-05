'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Calculator, AlertTriangle, History } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type InsumoStockRow = {
  id: string
  insumoId: string
  codigo: string
  nombre: string
  categoria: string | null
  sucursalId: string
  sucursalNombre: string
  cantidad: number
  stockMinimo: number
  unidadAbreviatura: string
  costoUnitario: number
  valorTotal: number
  estado: 'ok' | 'bajo' | 'agotado'
}

const LABELS_CATEGORIAS: Record<string, string> = {
  cafe: 'Café',
  lacteos: 'Lácteos',
  endulzantes: 'Endulzantes',
  desechables: 'Desechables',
  reposteria: 'Repostería',
  te: 'Tés',
  jugos: 'Jugos',
  limpieza: 'Limpieza',
  otros: 'Otros',
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export const insumosColumnas: ColumnDef<InsumoStockRow, any>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.codigo}</span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: 'Insumo',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.nombre}</div>
        {row.original.categoria && (
          <Badge variant="outline" className="text-xs mt-1">
            {LABELS_CATEGORIAS[row.original.categoria] ?? row.original.categoria}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'sucursalNombre',
    header: 'Sucursal',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.sucursalNombre}</span>
    ),
  },
  {
    id: 'stock',
    header: 'Stock Actual',
    cell: ({ row }) => {
      const item = row.original
      const porcentaje =
        item.stockMinimo > 0
          ? Math.min(100, (item.cantidad / (item.stockMinimo * 2)) * 100)
          : 100

      return (
        <div className="space-y-1 min-w-[150px]">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {item.cantidad.toFixed(2)} {item.unidadAbreviatura}
            </span>
            {item.estado === 'agotado' && (
              <Badge variant="destructive" className="text-xs">
                Agotado
              </Badge>
            )}
            {item.estado === 'bajo' && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                Bajo
              </Badge>
            )}
            {item.estado === 'ok' && (
              <Badge variant="default" className="text-xs bg-green-600">
                OK
              </Badge>
            )}
          </div>
          {item.stockMinimo > 0 && (
            <Progress
              value={porcentaje}
              className={
                item.estado === 'agotado'
                  ? 'bg-red-100 [&>*]:bg-red-500'
                  : item.estado === 'bajo'
                    ? 'bg-amber-100 [&>*]:bg-amber-500'
                    : 'bg-green-100 [&>*]:bg-green-500'
              }
            />
          )}
          <p className="text-xs text-muted-foreground">
            Mínimo: {item.stockMinimo.toFixed(2)} {item.unidadAbreviatura}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: 'costoUnitario',
    header: 'Costo Unit.',
    cell: ({ row }) => (
      <span className="text-sm">{formatearMoneda(row.original.costoUnitario)}</span>
    ),
  },
  {
    accessorKey: 'valorTotal',
    header: 'Valor Total',
    cell: ({ row }) => (
      <span className="font-medium">{formatearMoneda(row.original.valorTotal)}</span>
    ),
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onAjustar?: (item: InsumoStockRow) => void
        onVerHistorial?: (item: InsumoStockRow) => void
        permisos?: string[]
      }
      const puedeAjustar = (meta.permisos ?? []).includes('inventario:ajustar')

      return (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => meta.onVerHistorial?.(row.original)}
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver historial</TooltipContent>
          </Tooltip>

          {puedeAjustar && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => meta.onAjustar?.(row.original)}
            >
              <Calculator className="mr-1 h-3 w-3" />
              Ajustar
            </Button>
          )}
        </div>
      )
    },
  },
]