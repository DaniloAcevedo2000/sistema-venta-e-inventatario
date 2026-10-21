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
import { Plus, Search, Columns3, AlertCircle } from 'lucide-react'
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
import { columnas, type ProductoRow } from './columnas'
import { toggleActivoProductoAction, eliminarProductoAction } from './actions'

type Categoria = {
  id: string
  nombre: string
  codigo: string
  padreId: string | null
}

type Props = {
  productos: ProductoRow[]
  categorias: Categoria[]
  permisos: string[]
}

type DialogAccion = {
  tipo: 'toggle' | 'eliminar'
  productoId: string
  productoNombre: string
  activoActual: boolean
}

export function ProductosTable({ productos, categorias, permisos }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  // Dialog de confirmación
  const [dialogAccion, setDialogAccion] = React.useState<DialogAccion | null>(null)
  const [motivo, setMotivo] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)

  const puedeCrear = permisos.includes('productos:crear')

  // ============================================
  // ABRIR DIALOG
  // ============================================
  const abrirDialogToggle = (id: string, nombre: string, activoActual: boolean) => {
    setMotivo('')
    setDialogAccion({
      tipo: 'toggle',
      productoId: id,
      productoNombre: nombre,
      activoActual,
    })
  }

  const abrirDialogEliminar = (id: string, nombre: string) => {
    setMotivo('')
    setDialogAccion({
      tipo: 'eliminar',
      productoId: id,
      productoNombre: nombre,
      activoActual: false,
    })
  }

  // ============================================
  // EJECUTAR ACCIÓN
  // ============================================
  const ejecutarAccion = async () => {
    if (!dialogAccion) return

    if (motivo.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres')
      return
    }

    setProcesando(true)
    try {
      const result =
        dialogAccion.tipo === 'toggle'
          ? await toggleActivoProductoAction(dialogAccion.productoId, motivo)
          : await eliminarProductoAction(dialogAccion.productoId, motivo)

      if (result.success) {
        toast.success(
          dialogAccion.tipo === 'toggle'
            ? dialogAccion.activoActual
              ? 'Producto desactivado'
              : 'Producto activado'
            : 'Producto eliminado'
        )
        setDialogAccion(null)
        setMotivo('')
      } else {
        toast.error(result.error || 'Error al ejecutar la acción')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error inesperado')
    } finally {
      setProcesando(false)
    }
  }

  // ============================================
  // TABLA
  // ============================================
  const table = useReactTable({
    data: productos,
    columns: columnas,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
    meta: {
      onToggleActivo: abrirDialogToggle,
      onEliminar: abrirDialogEliminar,
      permisos,
    },
  })

  const totalProductos = productos.length
  const activos = productos.filter((p) => p.activo).length
  const inactivos = totalProductos - activos

  // Valores de filtros
  const categoriaSeleccionada =
    (table.getColumn('categoria')?.getFilterValue() as string) ?? 'all'

  const estadoSeleccionado =
    (table.getColumn('activo')?.getFilterValue() as boolean | undefined) === undefined
      ? 'all'
      : table.getColumn('activo')?.getFilterValue() === true
        ? 'true'
        : 'false'

  return (
    <div className="space-y-4">
      {/* Barra de estadísticas */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <Badge variant="secondary">Total: {totalProductos}</Badge>
        <Badge variant="default" className="bg-green-600">
          Activos: {activos}
        </Badge>
        <Badge variant="outline">Inactivos: {inactivos}</Badge>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={categoriaSeleccionada}
            onValueChange={(value) =>
              table
                .getColumn('categoria')
                ?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.nombre}>
                  {cat.padreId ? '  └ ' : ''}
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={estadoSeleccionado}
            onValueChange={(value) => {
              if (value === 'all') {
                table.getColumn('activo')?.setFilterValue(undefined)
              } else {
                table.getColumn('activo')?.setFilterValue(value === 'true')
              }
            }}
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
              <Link href="/productos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  className="h-24 text-center"
                >
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {productos.length} productos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* ============================================
          DIALOG DE CONFIRMACIÓN CON MOTIVO
          ============================================ */}
      <Dialog
        open={!!dialogAccion}
        onOpenChange={(open) => {
          if (!open && !procesando) {
            setDialogAccion(null)
            setMotivo('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {dialogAccion?.tipo === 'eliminar'
                ? 'Eliminar producto'
                : dialogAccion?.activoActual
                  ? 'Desactivar producto'
                  : 'Activar producto'}
            </DialogTitle>
            <DialogDescription>
              {dialogAccion?.tipo === 'eliminar' ? (
                <>
                  Estás a punto de eliminar{' '}
                  <strong>{dialogAccion?.productoNombre}</strong>. Esta acción no
                  se puede deshacer.
                </>
              ) : dialogAccion?.activoActual ? (
                <>
                  Vas a desactivar{' '}
                  <strong>{dialogAccion?.productoNombre}</strong>. No aparecerá en
                  el POS hasta que lo reactives.
                </>
              ) : (
                <>
                  Vas a activar{' '}
                  <strong>{dialogAccion?.productoNombre}</strong>. Aparecerá
                  nuevamente en el POS.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Producto descontinuado, cambio de proveedor, ajuste de inventario..."
              rows={3}
              disabled={procesando}
            />
            <p className="text-xs text-muted-foreground">
              Este motivo quedará registrado en la auditoría del sistema.
              Mínimo 3 caracteres.
            </p>
            {motivo.length > 0 && motivo.trim().length < 3 && (
              <p className="text-xs text-red-500">
                El motivo debe tener al menos 3 caracteres
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogAccion(null)
                setMotivo('')
              }}
              disabled={procesando}
            >
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
    </div>
  )
}