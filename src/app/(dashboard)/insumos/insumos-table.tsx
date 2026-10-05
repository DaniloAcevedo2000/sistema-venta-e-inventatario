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
import { Plus, Search, Columns3, AlertCircle, Calculator, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { columnas, type InsumoRow } from './columnas'
import {
  toggleActivoInsumoAction,
  eliminarInsumoAction,
} from './actions'
import { PrecioMasivoDialog } from './precio-masivo-dialog'
import { CATEGORIAS_INSUMO } from './schema'

type Props = {
  insumos: InsumoRow[]
  permisos: string[]
}

type DialogAccion = {
  tipo: 'toggle' | 'eliminar'
  insumoId: string
  insumoNombre: string
  activoActual: boolean
}

export function InsumosTable({ insumos, permisos }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [rowSelection, setRowSelection] = React.useState({})

  const [dialogAccion, setDialogAccion] = React.useState<DialogAccion | null>(null)
  const [motivo, setMotivo] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)
  const [precioMasivoOpen, setPrecioMasivoOpen] = React.useState(false)

  const puedeCrear = permisos.includes('inventario:ajustar')

  const abrirDialogToggle = (id: string, nombre: string, activoActual: boolean) => {
    setMotivo('')
    setDialogAccion({ tipo: 'toggle', insumoId: id, insumoNombre: nombre, activoActual })
  }

  const abrirDialogEliminar = (id: string, nombre: string) => {
    setMotivo('')
    setDialogAccion({ tipo: 'eliminar', insumoId: id, insumoNombre: nombre, activoActual: false })
  }

  const ejecutarAccion = async () => {
    if (!dialogAccion) return
    if (motivo.trim().length < 3) {
      toast.error('El motivo debe tener al menos 3 caracteres')
      return
    }

    setProcesando(true)
    try {
      const result =
        dialogAccion.tipo === 'toggle'
          ? await toggleActivoInsumoAction(dialogAccion.insumoId, motivo)
          : await eliminarInsumoAction(dialogAccion.insumoId, motivo)

      if (result.success) {
        toast.success(
          dialogAccion.tipo === 'toggle'
            ? dialogAccion.activoActual ? 'Insumo desactivado' : 'Insumo activado'
            : 'Insumo eliminado'
        )
        setDialogAccion(null)
        setMotivo('')
      } else {
        toast.error(result.error || 'Error')
      }
    } finally {
      setProcesando(false)
    }
  }

  const table = useReactTable({
    data: insumos,
    columns: columnas,
    state: { sorting, columnFilters, columnVisibility, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    meta: {
      onToggleActivo: abrirDialogToggle,
      onEliminar: abrirDialogEliminar,
      permisos,
    },
  })

  const totalInsumos = insumos.length
  const activos = insumos.filter((i) => i.activo).length
  const conAlerta = insumos.filter((i) => i.tieneAlerta).length
  const seleccionados = table.getFilteredSelectedRowModel().rows
  const insumosSeleccionados = seleccionados.map((r) => r.original)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <Badge variant="secondary">Total: {totalInsumos}</Badge>
        <Badge variant="default" className="bg-green-600">Activos: {activos}</Badge>
        {conAlerta > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Stock bajo: {conAlerta}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={(table.getColumn('categoriaInsumo')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('categoriaInsumo')?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIAS_INSUMO.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={table.getColumn('activo')?.getFilterValue() === undefined ? 'all' : String(table.getColumn('activo')?.getFilterValue())}
            onValueChange={(value) => {
              if (value === 'all') table.getColumn('activo')?.setFilterValue(undefined)
              else table.getColumn('activo')?.setFilterValue(value === 'true')
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {seleccionados.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrecioMasivoOpen(true)}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Actualizar {seleccionados.length} precio(s)
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
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
              <Link href="/insumos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Insumo
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnas.length} className="h-24 text-center">
                  No se encontraron insumos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {seleccionados.length > 0 && `${seleccionados.length} seleccionado(s) · `}
          Mostrando {table.getRowModel().rows.length} de {insumos.length} insumos
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

      {/* Dialog de motivo */}
      <Dialog open={!!dialogAccion} onOpenChange={(open) => !open && !procesando && setDialogAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {dialogAccion?.tipo === 'eliminar'
                ? 'Eliminar insumo'
                : dialogAccion?.activoActual ? 'Desactivar insumo' : 'Activar insumo'}
            </DialogTitle>
            <DialogDescription>
              {dialogAccion?.tipo === 'eliminar'
                ? <>Vas a eliminar <strong>{dialogAccion?.insumoNombre}</strong>. Esta acción no se puede deshacer.</>
                : dialogAccion?.activoActual
                  ? <>Vas a desactivar <strong>{dialogAccion?.insumoNombre}</strong>.</>
                  : <>Vas a activar <strong>{dialogAccion?.insumoNombre}</strong>.</>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Motivo <span className="text-destructive">*</span></Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Cambio de proveedor, insumo descontinuado..."
              rows={3}
              disabled={procesando}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAccion(null)} disabled={procesando}>
              Cancelar
            </Button>
            <Button
              onClick={ejecutarAccion}
              disabled={procesando || motivo.trim().length < 3}
              variant={dialogAccion?.tipo === 'eliminar' ? 'destructive' : 'default'}
            >
              {procesando ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de precios masivos */}
      <PrecioMasivoDialog
        open={precioMasivoOpen}
        onOpenChange={(open) => {
          setPrecioMasivoOpen(open)
          if (!open) {
            table.resetRowSelection()
          }
        }}
        insumosSeleccionados={insumosSeleccionados.map((i) => ({
          id: i.id,
          codigo: i.codigo,
          nombre: i.nombre,
          costoUnitario: i.costoUnitario,
          unidadMedida: { abreviatura: i.unidadMedida.abreviatura },
        }))}
      />
    </div>
  )
}