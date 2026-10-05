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
import { columnas, type CategoriaRow } from './columnas'
import {
  toggleActivoCategoriaAction,
  eliminarCategoriaAction,
} from './actions'

type Props = {
  categorias: CategoriaRow[]
  permisos: string[]
}

type DialogAccion = {
  tipo: 'toggle' | 'eliminar'
  categoriaId: string
  categoriaNombre: string
  activoActual: boolean
}

// ============================================
// CONSTRUIR ÁRBOL JERÁRQUICO
// ============================================
function construirArbol(categorias: CategoriaRow[]): CategoriaRow[] {
  const map = new Map<string, CategoriaRow & { children: CategoriaRow[] }>()
  const roots: (CategoriaRow & { children: CategoriaRow[] })[] = []

  // Primero, agregar children vacío
  categorias.forEach((c) => {
    map.set(c.id, { ...c, children: [] })
  })

  // Luego, asignar hijos a padres
  categorias.forEach((c) => {
    const nodo = map.get(c.id)!
    if (c.padreId && map.has(c.padreId)) {
      map.get(c.padreId)!.children.push(nodo)
    } else {
      roots.push(nodo)
    }
  })

  // Aplanar respetando la jerarquía
  const aplanado: CategoriaRow[] = []
  const visitar = (nodo: CategoriaRow & { children: CategoriaRow[] }, level: number) => {
    aplanado.push({ ...nodo, _level: level } as any)
    nodo.children.forEach((hijo) => visitar(hijo as any, level + 1))
  }

  roots.forEach((root) => visitar(root, 0))

  return aplanado
}

export function CategoriasTable({ categorias, permisos }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  const [dialogAccion, setDialogAccion] = React.useState<DialogAccion | null>(null)
  const [motivo, setMotivo] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)

  const puedeCrear = permisos.includes('categorias:gestionar')

  // Árbol aplanado respetando jerarquía
  const arbol = React.useMemo(() => construirArbol(categorias), [categorias])

  // Set de IDs con hijos
  const idsConHijos = React.useMemo(() => {
    const set = new Set<string>()
    categorias.forEach((c) => {
      if (c.padreId) set.add(c.padreId)
    })
    return set
  }, [categorias])

  // Filtrar por expansión: mostrar solo si ningún ancestro está colapsado
  const datosVisibles = React.useMemo(() => {
    return arbol.filter((cat: any) => {
      let current = cat
      while (current.padreId) {
        if (!expandedIds.has(current.padreId)) return false
        const padre = arbol.find((c: any) => c.id === current.padreId)
        if (!padre) break
        current = padre
      }
      return true
    })
  }, [arbol, expandedIds])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getLevel = (cat: CategoriaRow): number => {
    return (cat as any)._level ?? 0
  }

  const hasChildren = (id: string): boolean => idsConHijos.has(id)

  // Expansión inicial: todas las raíces
  React.useEffect(() => {
    const raices = categorias.filter((c) => !c.padreId).map((c) => c.id)
    setExpandedIds(new Set(raices))
  }, [categorias])

  // ============================================
  // DIALOG
  // ============================================
  const abrirDialogToggle = (id: string, nombre: string, activoActual: boolean) => {
    setMotivo('')
    setDialogAccion({ tipo: 'toggle', categoriaId: id, categoriaNombre: nombre, activoActual })
  }

  const abrirDialogEliminar = (id: string, nombre: string) => {
    setMotivo('')
    setDialogAccion({ tipo: 'eliminar', categoriaId: id, categoriaNombre: nombre, activoActual: false })
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
          ? await toggleActivoCategoriaAction(dialogAccion.categoriaId, motivo)
          : await eliminarCategoriaAction(dialogAccion.categoriaId, motivo)

      if (result.success) {
        toast.success(
          dialogAccion.tipo === 'toggle'
            ? dialogAccion.activoActual ? 'Categoría desactivada' : 'Categoría activada'
            : 'Categoría eliminada'
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
    data: datosVisibles,
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
    initialState: { pagination: { pageSize: 50 } },
    meta: {
      expandedIds,
      toggleExpand,
      getLevel,
      hasChildren,
      onToggleActivo: abrirDialogToggle,
      onEliminar: abrirDialogEliminar,
      permisos,
    },
  })

  const totalCategorias = categorias.length
  const activas = categorias.filter((c) => c.activo).length
  const inactivas = totalCategorias - activas

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <Badge variant="secondary">Total: {totalCategorias}</Badge>
        <Badge variant="default" className="bg-green-600">Activas: {activas}</Badge>
        <Badge variant="outline">Inactivas: {inactivas}</Badge>
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
            value={(table.getColumn('activo')?.getFilterValue() as string | undefined) === undefined ? 'all' : String(table.getColumn('activo')?.getFilterValue())}
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
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="true">Activas</SelectItem>
              <SelectItem value="false">Inactivas</SelectItem>
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
              <Link href="/categorias/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
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
                  No se encontraron categorías.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {categorias.length} categorías
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

      {/* DIALOG */}
      <Dialog open={!!dialogAccion} onOpenChange={(open) => !open && !procesando && setDialogAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {dialogAccion?.tipo === 'eliminar'
                ? 'Eliminar categoría'
                : dialogAccion?.activoActual ? 'Desactivar categoría' : 'Activar categoría'}
            </DialogTitle>
            <DialogDescription>
              {dialogAccion?.tipo === 'eliminar' ? (
                <>Estás a punto de eliminar <strong>{dialogAccion?.categoriaNombre}</strong>. Esta acción no se puede deshacer.</>
              ) : dialogAccion?.activoActual ? (
                <>Vas a desactivar <strong>{dialogAccion?.categoriaNombre}</strong>.</>
              ) : (
                <>Vas a activar <strong>{dialogAccion?.categoriaNombre}</strong>.</>
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
              placeholder="Ej: Reorganización del menú, categoría obsoleta..."
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
    </div>
  )
}