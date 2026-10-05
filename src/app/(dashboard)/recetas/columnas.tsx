'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power, Trash2, Calculator, Plus } from 'lucide-react'
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

export type RecetaRow = {
  id: string
  productoId: string
  notas: string | null
  activa: boolean
  producto: {
    id: string
    codigo: string
    nombre: string
    precioBase: string
    imagenUrl: string | null
    color: string | null
    categoria: { nombre: string }
  }
  itemsCount: number
  costoCalculado: string
}

function formatearMoneda(valor: string) {
  return `C$ ${parseFloat(valor).toFixed(2)}`
}

export const columnas: ColumnDef<RecetaRow, any>[] = [
  {
    accessorKey: 'producto.codigo',
    header: 'Código',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.producto.codigo}</span>
    ),
  },
  {
    accessorKey: 'producto.nombre',
    header: 'Producto',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 rounded-md flex-shrink-0 border"
          style={{ backgroundColor: row.original.producto.color || '#E8E0D8' }}
        >
          {row.original.producto.imagenUrl && (
            <img
              src={row.original.producto.imagenUrl}
              alt={row.original.producto.nombre}
              className="h-full w-full object-cover rounded-md"
            />
          )}
        </div>
        <div>
          <div className="font-medium">{row.original.producto.nombre}</div>
          <p className="text-xs text-muted-foreground">
            {row.original.producto.categoria.nombre}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'insumos',
    accessorFn: (row) => row.itemsCount,
    header: 'Insumos',
    cell: ({ row }) => (
      <Badge variant="secondary" className="gap-1">
        <Calculator className="h-3 w-3" />
        {row.original.itemsCount}
      </Badge>
    ),
  },
  {
    id: 'costo',
    accessorFn: (row) => row.costoCalculado,
    header: 'Costo Receta',
    cell: ({ row }) => (
      <span className="font-medium text-destructive">
        {formatearMoneda(row.original.costoCalculado)}
      </span>
    ),
  },
  {
    accessorKey: 'producto.precioBase',
    header: 'Precio Venta',
    cell: ({ row }) => (
      <span className="font-medium">
        {formatearMoneda(row.original.producto.precioBase)}
      </span>
    ),
  },
  {
    id: 'margen',
    header: 'Margen',
    cell: ({ row }) => {
      const precio = parseFloat(row.original.producto.precioBase)
      const costo = parseFloat(row.original.costoCalculado)
      const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0

      return (
        <Badge
          variant={margen > 40 ? 'default' : margen > 20 ? 'secondary' : 'destructive'}
        >
          {margen.toFixed(1)}%
        </Badge>
      )
    },
  },
  {
    accessorKey: 'activa',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.activa ? 'default' : 'secondary'}>
        {row.original.activa ? 'Activa' : 'Inactiva'}
      </Badge>
    ),
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const receta = row.original
      const meta = table.options.meta as {
        onToggleActiva?: (id: string, nombre: string, activaActual: boolean) => void
        onEliminar?: (id: string, nombre: string) => void
        permisos?: string[]
      }
      const permisos = meta.permisos ?? []
      const puedeEditar = permisos.includes('productos:editar')

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
                  <Link href={`/recetas/${receta.productoId}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar receta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    meta.onToggleActiva?.(
                      receta.id,
                      receta.producto.nombre,
                      receta.activa
                    )
                  }
                >
                  <Power className="mr-2 h-4 w-4" />
                  {receta.activa ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    meta.onEliminar?.(receta.id, receta.producto.nombre)
                  }
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar receta
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]