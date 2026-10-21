'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import * as Icons from 'lucide-react'

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

export type CategoriaRow = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  icono: string | null
  color: string | null
  orden: number
  activo: boolean
  padreId: string | null
  padre: { id: string; nombre: string } | null
  _count: { productos: number; hijas: number }
}

export const columnas: ColumnDef<CategoriaRow, any>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.codigo}</span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: 'Categoría',
    cell: ({ row, table }) => {
      const cat = row.original
      const meta = table.options.meta as {
        expandedIds?: Set<string>
        toggleExpand?: (id: string) => void
        getLevel?: (cat: CategoriaRow) => number
        hasChildren?: (id: string) => boolean
      }

      const level = meta.getLevel?.(cat) ?? 0
      const hasChildren = meta.hasChildren?.(cat.id) ?? false
      const isExpanded = meta.expandedIds?.has(cat.id) ?? false

      // ✅ Fix: agregar `style` a la firma de props del componente
      const Icon = cat.icono
        ? (Icons[cat.icono as keyof typeof Icons] as React.ComponentType<{
            className?: string
            style?: React.CSSProperties
          }>)
        : null

      return (
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${level * 24}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => meta.toggleExpand?.(cat.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <span className="w-5" />
          )}
          {Icon ? (
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: cat.color ? `${cat.color}20` : '#E8E0D820',
              }}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: cat.color || '#6B4226' }}
              />
            </div>
          ) : (
            <div
              className="h-8 w-8 rounded-md flex-shrink-0"
              style={{ backgroundColor: cat.color || '#E8E0D8' }}
            />
          )}
          <div>
            <div className="font-medium">{cat.nombre}</div>
            {cat.descripcion && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {cat.descripcion}
              </p>
            )}
          </div>
        </div>
      )
    },
  },
  {
    id: 'padre',
    accessorFn: (row) => row.padre?.nombre ?? '',
    header: 'Categoría Padre',
    cell: ({ row }) =>
      row.original.padre ? (
        <Badge variant="outline">{row.original.padre.nombre}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">— Principal —</span>
      ),
  },
  {
    id: 'productos',
    accessorFn: (row) => row._count.productos,
    header: 'Productos',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count.productos}</Badge>
    ),
  },
  {
    id: 'subcategorias',
    accessorFn: (row) => row._count.hijas,
    header: 'Subcategorías',
    cell: ({ row }) =>
      row.original._count.hijas > 0 ? (
        <Badge variant="secondary">{row.original._count.hijas}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.activo ? 'default' : 'secondary'}>
        {row.original.activo ? 'Activa' : 'Inactiva'}
      </Badge>
    ),
    filterFn: (row, id, value) => row.original.activo === value,
  },
  {
    id: 'acciones',
    cell: ({ row, table }) => {
      const cat = row.original
      const meta = table.options.meta as {
        onToggleActivo?: (
          id: string,
          nombre: string,
          activoActual: boolean
        ) => void
        onEliminar?: (id: string, nombre: string) => void
        permisos?: string[]
      }
      const permisos = meta.permisos ?? []
      const puedeEditar = permisos.includes('categorias:gestionar')

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
                  <Link href={`/categorias/${cat.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    meta.onToggleActivo?.(cat.id, cat.nombre, cat.activo)
                  }
                >
                  <Power className="mr-2 h-4 w-4" />
                  {cat.activo ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => meta.onEliminar?.(cat.id, cat.nombre)}
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