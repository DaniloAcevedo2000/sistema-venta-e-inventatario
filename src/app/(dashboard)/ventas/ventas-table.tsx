'use client'

import * as React from 'react'
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
import {
  Search,
  Columns3,
  X,
  DollarSign,
  Receipt,
  TrendingUp,
  ShoppingCart,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { columnas, type VentaRow } from './columnas'
import { VentaDetalleDialog } from './venta-detalle-dialog'
import { AnularVentaDialog } from './anular-venta-dialog'

type Stats = {
  totalHoy: number
  totalMes: number
  cantidadHoy: number
  cantidadMes: number
  ticketPromedio: number
}

type Props = {
  ventas: VentaRow[]
  permisos: string[]
  stats: Stats
}

export function VentasTable({ ventas, permisos, stats }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'fecha', desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const [ventaDetalle, setVentaDetalle] = React.useState<VentaRow | null>(null)
  const [detalleOpen, setDetalleOpen] = React.useState(false)

  const [ventaAnular, setVentaAnular] = React.useState<VentaRow | null>(null)
  const [anularOpen, setAnularOpen] = React.useState(false)

  // ============================================
  // HANDLERS
  // ============================================
  const verDetalle = (venta: VentaRow) => {
    setVentaDetalle(venta)
    setDetalleOpen(true)
  }

  const imprimir = (venta: VentaRow) => {
    if (!venta.facturaId) return
    // Abre el detalle para que el usuario imprima desde ahí
    verDetalle(venta)
  }

  const anular = (venta: VentaRow) => {
    if (venta.estado !== 'COMPLETADA') {
      toast.error('Esta venta ya está anulada')
      return
    }
    setVentaAnular(venta)
    setAnularOpen(true)
  }

  const handleAnulacionExitosa = () => {
    // Cerrar el dialog y recargar los datos
    setAnularOpen(false)
    setVentaAnular(null)
    // La revalidación la hace el server action con revalidatePath
    // Solo forzamos un refresh del componente
    window.location.reload()
  }

  // ============================================
  // TABLA
  // ============================================
  const table = useReactTable({
    data: ventas,
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
      onVerDetalle: verDetalle,
      onImprimir: imprimir,
      onAnular: anular,
      permisos,
    },
  })

  const totalVentas = ventas.length
  const completadas = ventas.filter((v) => v.estado === 'COMPLETADA').length
  const anuladas = ventas.filter((v) => v.estado === 'ANULADA').length

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ventas Hoy</p>
                  <p className="text-2xl font-bold">
                    C${' '}
                    {stats.totalHoy.toLocaleString('es-NI', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.cantidadHoy} ventas
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ventas del Mes</p>
                  <p className="text-2xl font-bold">
                    C${' '}
                    {stats.totalMes.toLocaleString('es-NI', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.cantidadMes} ventas
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ticket Promedio</p>
                  <p className="text-2xl font-bold">
                    C${' '}
                    {stats.ticketPromedio.toLocaleString('es-NI', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Promedio del mes
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Registros Cargados
                  </p>
                  <p className="text-2xl font-bold">{totalVentas}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completadas} ok · {anuladas} anuladas
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={
              (table.getColumn('estado')?.getFilterValue() as string) ?? 'all'
            }
            onValueChange={(value) =>
              table
                .getColumn('estado')
                ?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="COMPLETADA">Completadas</SelectItem>
              <SelectItem value="ANULADA">Anuladas</SelectItem>
            </SelectContent>
          </Select>

          {globalFilter && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Buscando: {globalFilter}
              <button
                onClick={() => setGlobalFilter('')}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

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
      </div>

      {/* Tabla */}
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
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => verDetalle(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        // Evitar que el click en acciones abra el detalle
                        if (cell.column.id === 'acciones') {
                          e.stopPropagation()
                        }
                      }}
                    >
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
                  No se encontraron ventas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {ventas.length} ventas
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

      {/* Dialog de detalle */}
      <VentaDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        venta={ventaDetalle}
      />

      {/* Dialog de anulación */}
      <AnularVentaDialog
        open={anularOpen}
        onOpenChange={setAnularOpen}
        venta={ventaAnular}
        permisos={permisos}
        onSuccess={handleAnulacionExitosa}
      />
    </div>
  )
}