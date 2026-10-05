'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power, Trash2, Star } from 'lucide-react'
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

export type ProductoRow = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  precioBase: string
  costo: string
  tipo: string
  tipoImpuesto: string
  activo: boolean
  destacado: boolean
  imagenUrl: string | null
  color: string | null
  categoria: { id: string; nombre: string; codigo: string }
  _count: { variantes: number }
  creadoEn: string
}

function formatearMoneda(valor: string) {
  return `C$ ${parseFloat(valor).toFixed(2)}`
}

export const columnas: ColumnDef<ProductoRow, any>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.codigo}</span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: 'Producto',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.imagenUrl ? (
          <img
            src={row.original.imagenUrl}
            alt={row.original.nombre}
            className="h-10 w-10 rounded-md object-cover border flex-shrink-0"
            onError={(e) => {
              // Si falla la imagen, mostrar el color como fallback
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="h-10 w-10 rounded-md flex-shrink-0 border"
          style={{
            backgroundColor: row.original.color || '#E8E0D8',
            display: row.original.imagenUrl ? 'none' : 'block',
          }}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.nombre}</span>
            {row.original.destacado && (
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
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
    id: 'categoria',
    accessorFn: (row) => row.categoria.nombre,
    header: 'Categoría',
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.categoria.nombre}</Badge>
    ),
    filterFn: (row, id, value) => {
      return row.original.categoria.nombre === value
    },
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo
      const variantes = row.original._count.variantes
      return (
        <Badge variant={tipo === 'variantes' ? 'default' : 'secondary'}>
          {tipo === 'variantes'
            ? `${variantes} variante${variantes !== 1 ? 's' : ''}`
            : tipo === 'combo'
              ? 'Combo'
              : 'Simple'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'precioBase',
    header: 'Precio',
    cell: ({ row }) => (
      <span className="font-medium">{formatearMoneda(row.original.precioBase)}</span>
    ),
  },
  {
    accessorKey: 'tipoImpuesto',
    header: 'IVA',
    cell: ({ row }) => {
      const t = row.original.tipoImpuesto
      const label = t === 'GRAVADO_15' ? '15%' : t === 'EXENTO' ? 'Exento' : 'N/A'
      const variant = t === 'GRAVADO_15' ? 'default' : 'outline'
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.activo ? 'default' : 'secondary'}>
        {row.original.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return row.original.activo === value
    },
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const producto = row.original
      const meta = table.options.meta as {
        onToggleActivo?: (id: string) => void
        onEliminar?: (id: string) => void
        permisos?: string[]
      }
      const permisos = meta.permisos ?? []
      const puedeEditar = permisos.includes('productos:editar')
      const puedeEliminar = permisos.includes('productos:eliminar')

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
                  <Link href={`/productos/${producto.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => meta.onToggleActivo?.(producto.id)}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {producto.activo ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
              </>
            )}
            {puedeEliminar && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => meta.onEliminar?.(producto.id)}
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