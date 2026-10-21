'use client'

import * as React from 'react'
import Link from 'next/link'
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
} from '@tanstack/react-table'
import { Plus, Search, Columns3 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { columnas, type ProveedorRow } from './columnas'
import { toggleActivoProveedorAction } from './actions'

type Props = {
  proveedores: ProveedorRow[]
  permisos: string[]
}

export function ProveedoresTable({ proveedores, permisos }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'nombre', desc: false },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)

  // Estado para el dialog de activar/desactivar
  const [dialogToggle, setDialogToggle] = React.useState<{
    id: string
    nombre: string
    activoActual: boolean
  } | null>(null)

  const puedeCrear = permisos.includes('compras:crear')

  // ============================================
  // HANDLERS
  // ============================================
  const abrirToggle = (id: string, nombre: string, activoActual: boolean) => {
    setDialogToggle({ id, nombre, activoActual })
  }

  const ejecutarToggle = async () => {
    if (!dialogToggle) return
    
    setProcesando(true)
    const res = await toggleActivoProveedorAction(dialogToggle.id, !dialogToggle.activoActual)
    
    if (res.success) {
      toast.success(dialogToggle.activoActual ? 'Proveedor desactivado' : 'Proveedor activado')
      setDialogToggle(null)
      window.location.reload()
    } else {
      toast.error(res.error || 'Error al cambiar estado')
    }
    setProcesando(false)
  }

  const table = useReactTable({
    data: proveedores,
    columns: columnas,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    meta: {
      onToggleActivo: abrirToggle,
      permisos,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código, RUC..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={(table.getColumn('activo')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('activo')?.setFilterValue(value === 'all' ? undefined : value === 'true')
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {puedeCrear && (
            <Button asChild>
              <Link href="/proveedores/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proveedor
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
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
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => { if (cell.column.id === 'acciones') e.stopPropagation() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnas.length} className="h-24 text-center text-muted-foreground">
                  No se encontraron proveedores
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {proveedores.length} proveedores
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

      {/* DIALOG PARA ACTIVAR/DESACTIVAR */}
      <Dialog open={!!dialogToggle} onOpenChange={(open) => !open && !procesando && setDialogToggle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogToggle?.activoActual ? 'Desactivar' : 'Activar'} Proveedor
            </DialogTitle>
            <DialogDescription>
              {dialogToggle?.activoActual
                ? `¿Estás seguro que deseas desactivar a ${dialogToggle?.nombre}? Los proveedores inactivos no aparecerán en nuevas órdenes de compra.`
                : `¿Deseas volver a activar a ${dialogToggle?.nombre}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogToggle(null)}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              onClick={ejecutarToggle}
              disabled={procesando}
              variant={dialogToggle?.activoActual ? 'destructive' : 'default'}
            >
              {procesando ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}