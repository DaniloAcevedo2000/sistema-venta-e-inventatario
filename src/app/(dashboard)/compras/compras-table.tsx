'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ColumnFiltersState, SortingState, VisibilityState, flexRender,
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
} from '@tanstack/react-table'
import { Plus, Search, Columns3 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { columnas, type OrdenCompraRow } from './columnas'
import { recibirOrdenCompraAction, cancelarOrdenCompraAction } from './actions'

type Props = {
  ordenes: OrdenCompraRow[]
  permisos: string[]
}

export function ComprasTable({ ordenes, permisos }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'fecha', desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)

  // Estados para modales
  const [dialogRecibir, setDialogRecibir] = React.useState<{ id: string, codigo: string } | null>(null)
  const [dialogCancelar, setDialogCancelar] = React.useState<{ id: string, codigo: string } | null>(null)

  const puedeCrear = permisos.includes('compras:crear')

  // Handlers
  const ejecutarRecibir = async () => {
    if (!dialogRecibir) return
    setProcesando(true)
    const res = await recibirOrdenCompraAction(dialogRecibir.id)
    if (res.success) {
      toast.success('Stock actualizado correctamente')
      setDialogRecibir(null)
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setProcesando(false)
  }

  const ejecutarCancelar = async () => {
    if (!dialogCancelar) return
    setProcesando(true)
    const res = await cancelarOrdenCompraAction(dialogCancelar.id)
    if (res.success) {
      toast.success('Orden cancelada')
      setDialogCancelar(null)
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setProcesando(false)
  }

  const table = useReactTable({
    data: ordenes,
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
      onRecibir: (id: string, codigo: string) => setDialogRecibir({ id, codigo }),
      onCancelar: (id: string, codigo: string) => setDialogCancelar({ id, codigo }),
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
              placeholder="Buscar por código o proveedor..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={(table.getColumn('estado')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) => table.getColumn('estado')?.setFilterValue(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="BORRADOR">Borrador</SelectItem>
              <SelectItem value="RECIBIDA">Recibida</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" /> Columnas
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
              <Link href="/compras/nueva">
                <Plus className="mr-2 h-4 w-4" /> Nueva Orden
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
                    <TableCell key={cell.id} onClick={(e) => { if (cell.column.id === 'acciones') e.stopPropagation() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnas.length} className="h-24 text-center text-muted-foreground">
                  No se encontraron órdenes de compra
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {ordenes.length} órdenes
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

      {/* MODAL RECIBIR */}
      <Dialog open={!!dialogRecibir} onOpenChange={(o) => !o && !procesando && setDialogRecibir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recibir Orden {dialogRecibir?.codigo}</DialogTitle>
            <DialogDescription>
              Al confirmar la recepción, el inventario se sumará automáticamente y se registrará el costo en el Kardex. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRecibir(null)} disabled={procesando}>Cancelar</Button>
            <Button onClick={ejecutarRecibir} disabled={procesando} className="bg-green-600 hover:bg-green-700">
              {procesando ? 'Procesando...' : 'Confirmar Recepción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CANCELAR */}
      <Dialog open={!!dialogCancelar} onOpenChange={(o) => !o && !procesando && setDialogCancelar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Orden {dialogCancelar?.codigo}</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas cancelar esta orden? El stock no se verá afectado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCancelar(null)} disabled={procesando}>Volver</Button>
            <Button onClick={ejecutarCancelar} disabled={procesando} variant="destructive">
              {procesando ? 'Procesando...' : 'Cancelar Orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}