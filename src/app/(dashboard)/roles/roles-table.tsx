'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, Key } from 'lucide-react'

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export type RolRow = {
  id: string
  nombre: string
  codigo: string
  activo: boolean
  usuariosCount: number
  permisosCount: number
  usuarios: { id: string, nombre: string, correo: string }[]
  permisos: { id: string, nombre: string, codigo: string, grupo: string }[]
}

export function RolesTable({ data }: { data: RolRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Estados para los modales de detalle
  const [usuariosOpen, setUsuariosOpen] = React.useState(false)
  const [permisosOpen, setPermisosOpen] = React.useState(false)
  const [rolSeleccionado, setRolSeleccionado] = React.useState<RolRow | null>(null)

  const columnas: ColumnDef<RolRow, any>[] = [
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
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${row.original.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      accessorKey: 'usuariosCount',
      header: 'Usuarios',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => {
            setRolSeleccionado(row.original)
            setUsuariosOpen(true)
          }}
        >
          <Users className="h-3 w-3" />
          {row.original.usuariosCount}
        </Button>
      ),
    },
    {
      accessorKey: 'permisosCount',
      header: 'Permisos',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5 hover:bg-amber-100 hover:text-amber-700 transition-colors"
          onClick={() => {
            setRolSeleccionado(row.original)
            setPermisosOpen(true)
          }}
        >
          <Key className="h-3 w-3" />
          {row.original.permisosCount}
        </Button>
      ),
    },
    {
      id: 'acciones',
      cell: ({ row }) => {
        const rol = row.original
        const router = useRouter()
        if (rol.codigo === 'SUPER_ADMIN') return null // No se puede editar el super admin

        return (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/roles/${rol.id}`)}
            className="h-7 text-xs"
          >
            Editar
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns: columnas,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnas.length} className="h-24 text-center text-muted-foreground">
                  No hay roles registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} roles
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      </div>

      {/* MODAL DE USUARIOS */}
      <Dialog open={usuariosOpen} onOpenChange={setUsuariosOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Usuarios con rol: {rolSeleccionado?.nombre}
            </DialogTitle>
            <DialogDescription>
              Lista de usuarios que tienen asignado este rol.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolSeleccionado?.usuarios.length ? (
                  rolSeleccionado.usuarios.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-sm">{u.nombre}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.correo}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center h-20 text-muted-foreground">
                      No hay usuarios asignados a este rol.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PERMISOS */}
      <Dialog open={permisosOpen} onOpenChange={setPermisosOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" /> Permisos del rol: {rolSeleccionado?.nombre}
            </DialogTitle>
            <DialogDescription>
              Acciones y módulos a los que tiene acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Permiso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolSeleccionado?.permisos.length ? (
                  rolSeleccionado.permisos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium text-muted-foreground uppercase">{p.grupo}</TableCell>
                      <TableCell className="text-sm">{p.nombre}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center h-20 text-muted-foreground">
                      Este rol no tiene permisos asignados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}