'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

export type RolRow = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  esSistema: boolean
  activo: boolean
  usuariosCount: number
  permisosCount: number
}

export const columnas: ColumnDef<RolRow, any>[] = [
  {
    accessorKey: 'nombre',
    header: 'Rol',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <div>
          <p className="font-medium text-sm">{row.original.nombre}</p>
          <p className="text-xs text-muted-foreground">{row.original.codigo}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground max-w-[300px] truncate block">
        {row.original.descripcion || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'usuariosCount',
    header: 'Usuarios',
    cell: ({ row }) => <Badge variant="secondary">{row.original.usuariosCount}</Badge>,
  },
  {
    accessorKey: 'permisosCount',
    header: 'Permisos',
    cell: ({ row }) => <Badge variant="outline">{row.original.permisosCount}</Badge>,
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
    cell: ({ row }) => {
      const rol = row.original
      const router = useRouter()

      if (rol.esSistema) return null

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
            <DropdownMenuItem onClick={() => router.push(`/roles/${rol.id}`)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Power className="mr-2 h-4 w-4" /> Desactivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]