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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { columnas, type RecetaRow } from './columnas'
import { toggleActivaRecetaAction, eliminarRecetaAction } from './actions'

type Props = {
  recetas: RecetaRow[]
  permisos: string[]
}

type DialogAccion = {
  tipo: 'toggle' | 'eliminar'
  recetaId: string
  productoNombre: string
  activaActual: boolean
}

export function RecetasTable({ recetas, permisos }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const [dialogAccion, setDialogAccion] = React.useState<DialogAccion | null>(null)
  const [motivo, setMotivo] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)

  const puedeCrear = permisos.includes('productos:editar')

  const abrirDialogToggle = (id: string, nombre: string, activaActual: boolean) => {
    setMotivo('')
    setDialogAccion({
      tipo: 'toggle',
      recetaId: id,
      productoNombre: nombre,
      activaActual,
    })
  }

  const abrirDialogEliminar = (id: string, nombre: string) => {
    setMotivo('')
    setDialogAccion({
      tipo: 'eliminar',
      recetaId: id,
      productoNombre: nombre,
      activaActual: false,
    })
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
          ? await toggleActivaRecetaAction(dialogAccion.recetaId, motivo)
          : await eliminarRecetaAction(dialogAccion.recetaId, motivo)

      if (result.success) {
        toast.success(
          dialogAccion.tipo === 'toggle'
            ? dialogAccion.activaActual
              ? 'Receta desactivada'
              : 'Receta activada'
            : 'Receta eliminada'
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
    data: recetas,
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
      onToggleActiva: abrirDialogToggle,
      onEliminar: abrirDialogEliminar,
      permisos,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <Badge variant="secondary">Total: {recetas.length}</Badge>
        <Badge variant="default" className="bg-green-600">
          Activas: {recetas.filter((r) => r.activa).length}
        </Badge>
        <Badge variant="outline">
          Inactivas: {recetas.filter((r) => !r.activa).length}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
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
              <Link href="/recetas/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Receta
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
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  No hay recetas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {recetas.length} recetas
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
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
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

      <Dialog
        open={!!dialogAccion}
        onOpenChange={(open) => !open && !procesando && setDialogAccion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {dialogAccion?.tipo === 'eliminar'
                ? 'Eliminar receta'
                : dialogAccion?.activaActual
                  ? 'Desactivar receta'
                  : 'Activar receta'}
            </DialogTitle>
            <DialogDescription>
              {dialogAccion?.tipo === 'eliminar' ? (
                <>
                  Vas a eliminar la receta de{' '}
                  <strong>{dialogAccion?.productoNombre}</strong>. Esta acción no
                  se puede deshacer.
                </>
              ) : dialogAccion?.activaActual ? (
                <>
                  Vas a desactivar la receta de{' '}
                  <strong>{dialogAccion?.productoNombre}</strong>. No se descontará
                  inventario al vender.
                </>
              ) : (
                <>
                  Vas a activar la receta de{' '}
                  <strong>{dialogAccion?.productoNombre}</strong>.
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
              placeholder="Ej: Cambio de ingredientes, receta obsoleta..."
              rows={3}
              disabled={procesando}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogAccion(null)}
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