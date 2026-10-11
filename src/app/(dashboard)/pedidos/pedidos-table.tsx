'use client'

import { useSearchParams, useRouter } from 'next/navigation'

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
import {
  Search,
  Columns3,
  Plus,
  Clock,
  Truck,
  PackageCheck,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'

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
import { columnas, type PedidoRow } from './columnas'
import { PedidoDetalleDialog } from './pedido-detalle-dialog'

type Stats = {
  totalHoy: number
  activos: number
  enCamino: number
  entregadosHoy: number
}

type Props = {
  pedidos: PedidoRow[]
  permisos: string[]
  stats: Stats
}

export function PedidosTable({ pedidos, permisos, stats }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'fecha', desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const [pedidoDetalle, setPedidoDetalle] = React.useState<PedidoRow | null>(null)
  const [detalleOpen, setDetalleOpen] = React.useState(false)

  const puedeCrear = permisos.includes('pedidos:crear')


  const verDetalle = (p: PedidoRow) => {
    setPedidoDetalle(p)
    setDetalleOpen(true)
  }


  const searchParams = useSearchParams()
  const router = useRouter()

  React.useEffect(() => {
    const pedidoIdParam = searchParams.get('pedidoId')
    if (pedidoIdParam && pedidos.length > 0) {
      const pedidoEncontrado = pedidos.find((p) => p.id === pedidoIdParam)
      if (pedidoEncontrado) {
        setPedidoDetalle(pedidoEncontrado)
        setDetalleOpen(true)
        // Limpiar el query param sin recargar la página
        router.replace('/pedidos', { scroll: false })
      }
    }
  }, [searchParams, pedidos, router])

  const table = useReactTable({
    data: pedidos,
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
      permisos,
    },
  })

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos hoy</p>
                  <p className="text-2xl font-bold">{stats.totalHoy}</p>
                </div>
                <PackageCheck className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">{stats.activos}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    En proceso
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">En camino</p>
                  <p className="text-2xl font-bold">{stats.enCamino}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Delivery
                  </p>
                </div>
                <Truck className="h-8 w-8 text-cyan-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Entregados hoy
                  </p>
                  <p className="text-2xl font-bold">{stats.entregadosHoy}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
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
              placeholder="Buscar por número, cliente, teléfono..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={(table.getColumn('estado')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table
                .getColumn('estado')
                ?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDIENTE">Pendientes</SelectItem>
              <SelectItem value="CONFIRMADO">Confirmados</SelectItem>
              <SelectItem value="EN_PREPARACION">En preparación</SelectItem>
              <SelectItem value="LISTO">Listos</SelectItem>
              <SelectItem value="EN_CAMINO">En camino</SelectItem>
              <SelectItem value="ENTREGADO">Entregados</SelectItem>
              <SelectItem value="CANCELADO">Cancelados</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={(table.getColumn('tipo')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table
                .getColumn('tipo')
                ?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DELIVERY">Delivery</SelectItem>
              <SelectItem value="PICKUP">Pickup</SelectItem>
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
              <Link href="/pedidos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pedido
              </Link>
            </Button>
          )}
        </div>
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
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <PackageCheck className="h-10 w-10 opacity-30" />
                    <p className="font-medium">No hay pedidos registrados</p>
                    <p className="text-sm">Crea el primer pedido para empezar</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pedidos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {table.getRowModel().rows.length} de {pedidos.length}{' '}
            pedidos
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
      )}

      {/* Dialog detalle */}
      <PedidoDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        pedidoId={pedidoDetalle?.id ?? null}
        permisos={permisos}
      />
    </div>
  )
}