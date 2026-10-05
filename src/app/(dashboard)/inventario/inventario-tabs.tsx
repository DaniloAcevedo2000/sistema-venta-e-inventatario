'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
import { Search, X } from 'lucide-react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { insumosColumnas, type InsumoStockRow } from './insumos-columnas'
import { productosColumnas, type ProductoStockRow } from './productos-columnas'
import { AjusteDialog } from './ajuste-dialog'
import { StatsCards, type FiltroEstado } from './stats-cards'

type Sucursal = {
  id: string
  nombre: string
  codigo: string
}

type Props = {
  insumosStock: InsumoStockRow[]
  productosStock: ProductoStockRow[]
  sucursales: Sucursal[]
  permisos: string[]
}

export function InventarioTabs({
  insumosStock,
  productosStock,
  sucursales,
  permisos,
}: Props) {
  const router = useRouter()
  const [sucursalFiltro, setSucursalFiltro] = React.useState<string>('todas')
  const [filtroEstado, setFiltroEstado] = React.useState<FiltroEstado>('todos')
  const [tabActiva, setTabActiva] = React.useState<'insumos' | 'productos'>('insumos')

  const [dialogTipo, setDialogTipo] = React.useState<'insumo' | 'producto'>('insumo')
  const [dialogItem, setDialogItem] = React.useState<any>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // ============================================
  // Filtrar
  // ============================================
  const filtrar = <T extends { sucursalId: string; estado: string }>(
    items: T[]
  ): T[] => {
    let resultado = items
    if (sucursalFiltro !== 'todas') {
      resultado = resultado.filter((i) => i.sucursalId === sucursalFiltro)
    }
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((i) => i.estado === filtroEstado)
    }
    return resultado
  }

  const insumosFiltrados = filtrar(insumosStock)
  const productosFiltrados = filtrar(productosStock)

  // ============================================
  // Stats (con filtro de sucursal pero SIN filtro de estado)
  // ============================================
  const insumosBase =
    sucursalFiltro === 'todas'
      ? insumosStock
      : insumosStock.filter((i) => i.sucursalId === sucursalFiltro)
  const productosBase =
    sucursalFiltro === 'todas'
      ? productosStock
      : productosStock.filter((p) => p.sucursalId === sucursalFiltro)

  const totalInsumos = insumosBase.length
  const totalProductos = productosBase.length
  const alertas =
    insumosBase.filter((i) => i.estado === 'bajo').length +
    productosBase.filter((p) => p.estado === 'bajo').length
  const agotados =
    insumosBase.filter((i) => i.estado === 'agotado').length +
    productosBase.filter((p) => p.estado === 'agotado').length
  const ok =
    insumosBase.filter((i) => i.estado === 'ok').length +
    productosBase.filter((p) => p.estado === 'ok').length
  const valorTotal =
    insumosBase.reduce((sum, i) => sum + i.valorTotal, 0) +
    productosBase.reduce((sum, p) => sum + p.valorTotal, 0)

  // ============================================
  // Handlers
  // ============================================
  const abrirAjusteInsumo = (item: InsumoStockRow) => {
    setDialogTipo('insumo')
    setDialogItem({
      id: item.insumoId,
      nombre: item.nombre,
      codigo: item.codigo,
      sucursalId: item.sucursalId,
      sucursalNombre: item.sucursalNombre,
      stockActual: item.cantidad,
      unidadAbreviatura: item.unidadAbreviatura,
    })
    setDialogOpen(true)
  }

  const abrirAjusteProducto = (item: ProductoStockRow) => {
    setDialogTipo('producto')
    setDialogItem({
      id: item.productoId,
      nombre: item.nombre,
      codigo: item.codigo,
      sucursalId: item.sucursalId,
      sucursalNombre: item.sucursalNombre,
      stockActual: item.cantidad,
      unidadAbreviatura: item.unidadAbreviatura,
    })
    setDialogOpen(true)
  }

  const verHistorialInsumo = (item: InsumoStockRow) => {
    router.push(`/inventario/insumo/${item.insumoId}`)
  }

  const verHistorialProducto = (item: ProductoStockRow) => {
    router.push(`/inventario/producto/${item.productoId}`)
  }

  return (
    <div className="space-y-4">
      {/* Cards */}
      <StatsCards
        totalInsumos={totalInsumos}
        totalProductos={totalProductos}
        alertas={alertas}
        agotados={agotados}
        ok={ok}
        valorTotal={valorTotal}
        filtroActivo={filtroEstado}
        onFiltroChange={setFiltroEstado}
      />

      {/* Barra de filtros activos */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={sucursalFiltro} onValueChange={setSucursalFiltro}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Sucursal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las sucursales</SelectItem>
            {sucursales.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtroEstado !== 'todos' && (
          <Badge variant="secondary" className="gap-1 pr-1">
            Filtrando:{' '}
            {filtroEstado === 'ok'
              ? 'En stock'
              : filtroEstado === 'bajo'
                ? 'Stock bajo'
                : 'Agotados'}
            <button
              onClick={() => setFiltroEstado('todos')}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tabActiva} onValueChange={(v) => setTabActiva(v as any)}>
        <TabsList>
          <TabsTrigger value="insumos" className="gap-2">
            Insumos
            <Badge variant="secondary" className="ml-1 h-5">
              {insumosFiltrados.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="productos" className="gap-2">
            Productos
            <Badge variant="secondary" className="ml-1 h-5">
              {productosFiltrados.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insumos" className="mt-4">
          <TablaStock
            data={insumosFiltrados}
            columnas={insumosColumnas}
            onAjustar={abrirAjusteInsumo}
            onVerHistorial={verHistorialInsumo}
            permisos={permisos}
            emptyMessage="No hay insumos que coincidan con los filtros."
          />
        </TabsContent>

        <TabsContent value="productos" className="mt-4">
          <TablaStock
            data={productosFiltrados}
            columnas={productosColumnas}
            onAjustar={abrirAjusteProducto}
            onVerHistorial={verHistorialProducto}
            permisos={permisos}
            emptyMessage="No hay productos que coincidan con los filtros."
          />
        </TabsContent>
      </Tabs>

      <AjusteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tipo={dialogTipo}
        item={dialogItem}
      />
    </div>
  )
}

// ============================================
// TablaStock
// ============================================
function TablaStock({
  data,
  columnas,
  onAjustar,
  onVerHistorial,
  permisos,
  emptyMessage,
}: {
  data: any[]
  columnas: any
  onAjustar: (item: any) => void
  onVerHistorial: (item: any) => void
  permisos: string[]
  emptyMessage: string
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
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
    meta: { onAjustar, onVerHistorial, permisos },
  })

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8"
        />
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
                <TableCell
                  colSpan={columnas.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length}
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
    </div>
  )
}