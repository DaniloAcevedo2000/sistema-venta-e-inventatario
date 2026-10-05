'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  AlertTriangle,
  Package,
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
import { Checkbox } from '@/components/ui/checkbox'

export type InsumoRow = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoriaInsumo: string | null
  costoUnitario: string
  stockMinimo: string
  imagenUrl: string | null
  activo: boolean
  unidadMedida: { id: string; abreviatura: string; nombre: string }
  stockActual: string
  tieneAlerta: boolean
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

function formatearMoneda(valor: string) {
  return `C$ ${parseFloat(valor).toFixed(2)}`
}

export const columnas: ColumnDef<InsumoRow, any>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
      <div className="flex items-center gap-3">
        {row.original.imagenUrl ? (
          <img
            src={row.original.imagenUrl}
            alt={row.original.nombre}
            className="h-9 w-9 rounded-md object-cover border flex-shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div>
          <div className="font-medium flex items-center gap-2">
            {row.original.nombre}
            {row.original.tieneAlerta && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  Stock bajo: {row.original.stockActual} {row.original.unidadMedida.abreviatura} (mínimo {row.original.stockMinimo})
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {row.original.descripcion && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {row.original.descripcion}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    id: 'categoriaInsumo',
    accessorFn: (row) => row.categoriaInsumo ?? '',
    header: 'Categoría',
    cell: ({ row }) => (
      <Badge variant="outline">
        {LABELS_CATEGORIAS[row.original.categoriaInsumo ?? ''] ?? '—'}
      </Badge>
    ),
  },
  {
    id: 'unidad',
    accessorFn: (row) => row.unidadMedida.abreviatura,
    header: 'Unidad',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.unidadMedida.abreviatura}</span>
    ),
  },
  {
    accessorKey: 'costoUnitario',
    header: 'Costo Unitario',
    cell: ({ row }) => (
      <span className="font-medium">
        {formatearMoneda(row.original.costoUnitario)}
      </span>
    ),
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.activo ? 'default' : 'secondary'}>
        {row.original.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
    filterFn: (row, id, value) => row.original.activo === value,
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const insumo = row.original
      const meta = table.options.meta as {
        onToggleActivo?: (id: string, nombre: string, activoActual: boolean) => void
        onEliminar?: (id: string, nombre: string) => void
        permisos?: string[]
      }
      const permisos = meta.permisos ?? []
      const puedeEditar = permisos.includes('inventario:ajustar')

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
            {puedeEditar && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/insumos/${insumo.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => meta.onToggleActivo?.(insumo.id, insumo.nombre, insumo.activo)}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {insumo.activo ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => meta.onEliminar?.(insumo.id, insumo.nombre)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]