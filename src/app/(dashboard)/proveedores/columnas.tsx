'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power, Eye } from 'lucide-react'
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

export type ProveedorRow = {
  id: string
  codigo: string
  nombre: string
  nombreComercial: string | null
  ruc: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  activo: boolean
  ordenesCount: number
}

export const columnas: ColumnDef<ProveedorRow, any>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.codigo}</span>,
  },
  {
    accessorKey: 'nombre',
    header: 'Proveedor',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.nombre}</p>
        {row.original.nombreComercial && (
          <p className="text-xs text-muted-foreground">{row.original.nombreComercial}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'ruc',
    header: 'RUC',
    cell: ({ row }) => <span className="text-sm">{row.original.ruc || '—'}</span>,
  },
  {
    accessorKey: 'telefono',
    header: 'Contacto',
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.telefono && <p>{row.original.telefono}</p>}
        {row.original.correo && (
          <p className="text-xs text-muted-foreground">{row.original.correo}</p>
        )}
        {!row.original.telefono && !row.original.correo && <span className="text-muted-foreground">—</span>}
      </div>
    ),
  },
  {
    id: 'ordenes',
    header: 'Órdenes',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.ordenesCount}</Badge>
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
      const p = row.original
      // Aquí está la corrección: extraemos el meta de la tabla
      const meta = table.options.meta as {
        onToggleActivo?: (id: string, nombre: string, activoActual: boolean) => void
        permisos?: string[]
      }
      
      // Si por alguna razón meta no está definido, usamos un array vacío
      const permisos = meta?.permisos ?? []
      const puedeEditar = permisos.includes('compras:editar')

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
            {puedeEditar ? (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/proveedores/${p.id}`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => meta?.onToggleActivo?.(p.id, p.nombre, p.activo)}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {p.activo ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem disabled>Sin permisos</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]