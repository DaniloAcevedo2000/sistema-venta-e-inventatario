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
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
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
import { columnas, type CreditoRow } from './columnas'
import { DetalleClienteDialog } from './detalle-cliente-dialog'
import { AbonoDialog } from './abono-dialog'

type Stats = {
  totalPorCobrar: number
  clientesConSaldo: number
  clientesEnLimite: number
  saldoPromedio: number
}

type Props = {
  creditos: CreditoRow[]
  permisos: string[]
  stats: Stats
}

export function CreditosTable({ creditos, permisos, stats }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'saldoActual', desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const [detalleCliente, setDetalleCliente] = React.useState<CreditoRow | null>(null)
  const [detalleOpen, setDetalleOpen] = React.useState(false)

  const [abonoCliente, setAbonoCliente] = React.useState<CreditoRow | null>(null)
  const [abonoOpen, setAbonoOpen] = React.useState(false)

  const verDetalle = (c: CreditoRow) => {
    setDetalleCliente(c)
    setDetalleOpen(true)
  }

  const abrirAbono = (c: CreditoRow) => {
    setAbonoCliente(c)
    setAbonoOpen(true)
  }

  const table = useReactTable({
    data: creditos,
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
      onAbono: abrirAbono,
      permisos,
    },
  })

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Por cobrar</p>
                  <p className="text-2xl font-bold text-destructive">
                    C${' '}
                    {stats.totalPorCobrar.toLocaleString('es-NI', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Clientes con saldo
                  </p>
                  <p className="text-2xl font-bold">{stats.clientesConSaldo}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500/50" />
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
                  <p className="text-xs text-muted-foreground">En el límite</p>
                  <p className="text-2xl font-bold">{stats.clientesEnLimite}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No pueden comprar
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500/50" />
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
                  <p className="text-xs text-muted-foreground">Saldo promedio</p>
                  <p className="text-xl font-bold text-purple-600">
                    C${' '}
                    {stats.saldoPromedio.toLocaleString('es-NI', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500/50" />
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
              placeholder="Buscar por nombre, código, teléfono..."
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
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activo">Con saldo</SelectItem>
              <SelectItem value="limite_alcanzado">Límite alcanzado</SelectItem>
            </SelectContent>
          </Select>
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
                    <CheckCircle2 className="h-10 w-10 text-green-500/50" />
                    <p className="font-medium">¡Todo al día!</p>
                    <p className="text-sm">
                      No hay clientes con saldo pendiente
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {creditos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {table.getRowModel().rows.length} de {creditos.length}{' '}
            clientes
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

      {/* Dialogs */}
      <DetalleClienteDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        clienteId={detalleCliente?.id ?? null}
        onAbono={(clienteData) => {
          setDetalleOpen(false)
          // Crear objeto compatible con CreditoRow
          const credito: CreditoRow = {
            id: clienteData.id,
            codigo: clienteData.codigo,
            nombre: clienteData.nombre,
            nombreComercial: clienteData.nombreComercial,
            telefono: clienteData.telefono,
            correo: clienteData.correo,
            tipoDocumento: clienteData.tipoDocumento,
            numeroDocumento: clienteData.numeroDocumento,
            limiteCredito: clienteData.limiteCredito,
            saldoActual: clienteData.saldoActual,
            creditoDisponible: clienteData.creditoDisponible,
            porcentajeUsado:
              clienteData.limiteCredito > 0
                ? (clienteData.saldoActual / clienteData.limiteCredito) * 100
                : 0,
            cantidadComprasCredito: 0,
            ultimaCompra: null,
            diasSinPagar: null,
            estado: 'activo',
          }
          setAbonoCliente(credito)
          setAbonoOpen(true)
        }}
      />

      <AbonoDialog
        open={abonoOpen}
        onOpenChange={setAbonoOpen}
        cliente={abonoCliente}
      />
    </div>
  )
}