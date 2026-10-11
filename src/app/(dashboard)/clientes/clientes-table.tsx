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
import {
  Plus,
  Search,
  Columns3,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { columnas, type ClienteRow } from './columnas'
import { ClienteDetalleDialog } from './cliente-detalle-dialog'
import { AbonoDialog } from './abono-dialog'
import { toggleActivoClienteAction } from './actions'

type Stats = {
  totalClientes: number
  activos: number
  conCredito: number
  conSaldo: number
  totalPorCobrar: number
}

type Props = {
  clientes: ClienteRow[]
  permisos: string[]
  stats: Stats
}

export function ClientesTable({ clientes, permisos, stats }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'nombre', desc: false },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const [detalleCliente, setDetalleCliente] = React.useState<ClienteRow | null>(null)
  const [detalleOpen, setDetalleOpen] = React.useState(false)

  const [abonoCliente, setAbonoCliente] = React.useState<ClienteRow | null>(null)
  const [abonoOpen, setAbonoOpen] = React.useState(false)

  const [dialogToggle, setDialogToggle] = React.useState<{
    id: string
    nombre: string
    activoActual: boolean
  } | null>(null)
  const [motivoToggle, setMotivoToggle] = React.useState('')
  const [procesando, setProcesando] = React.useState(false)

  const puedeCrear = permisos.includes('clientes:crear')

  // ============================================
  // HANDLERS
  // ============================================
  const verDetalle = (c: ClienteRow) => {
    setDetalleCliente(c)
    setDetalleOpen(true)
  }

  const abrirAbono = (c: ClienteRow) => {
    setAbonoCliente(c)
    setAbonoOpen(true)
  }

  const abrirToggle = (id: string, nombre: string, activoActual: boolean) => {
    setMotivoToggle('')
    setDialogToggle({ id, nombre, activoActual })
  }

  const ejecutarToggle = async () => {
    if (!dialogToggle) return
    if (motivoToggle.trim().length < 3) {
      toast.error('El motivo debe tener al menos 3 caracteres')
      return
    }

    setProcesando(true)
    try {
      const result = await toggleActivoClienteAction(
        dialogToggle.id,
        motivoToggle
      )
      if (result.success) {
        toast.success(
          dialogToggle.activoActual ? 'Cliente desactivado' : 'Cliente activado'
        )
        setDialogToggle(null)
        window.location.reload()
      } else {
        toast.error(result.error || 'Error')
      }
    } finally {
      setProcesando(false)
    }
  }

  const table = useReactTable({
    data: clientes,
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
      onToggleActivo: abrirToggle,
      onAbono: abrirAbono,
      permisos,
    },
  })

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.totalClientes}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activos} activos
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500/50" />
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
                  <p className="text-xs text-muted-foreground">Con crédito</p>
                  <p className="text-2xl font-bold">{stats.conCredito}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Habilitados
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500/50" />
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
                  <p className="text-xs text-muted-foreground">Con saldo</p>
                  <p className="text-2xl font-bold">{stats.conSaldo}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pendientes
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500/50" />
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
                  <p className="text-xs text-muted-foreground">Por cobrar</p>
                  <p className="text-xl font-bold text-purple-600">
                    C${' '}
                    {stats.totalPorCobrar.toLocaleString('es-NI', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total pendiente
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
              (table.getColumn('activo')?.getFilterValue() as string) ?? 'all'
            }
            onValueChange={(value) =>
              table
                .getColumn('activo')
                ?.setFilterValue(value === 'all' ? undefined : value === 'true')
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
              <Link href="/clientes/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {clientes.length} clientes
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

      {/* Dialog detalle */}
      <ClienteDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        clienteId={detalleCliente?.id ?? null}
        onAbono={(cliente) => {
          setDetalleOpen(false)
          abrirAbono(cliente as any)
        }}
      />

      {/* Dialog abono */}
      <AbonoDialog
        open={abonoOpen}
        onOpenChange={setAbonoOpen}
        cliente={abonoCliente}
      />

      {/* Dialog toggle activo */}
      <Dialog
        open={!!dialogToggle}
        onOpenChange={(open) => !open && !procesando && setDialogToggle(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogToggle?.activoActual ? 'Desactivar' : 'Activar'} cliente
            </DialogTitle>
            <DialogDescription>
              {dialogToggle?.activoActual
                ? `Vas a desactivar a ${dialogToggle?.nombre}.`
                : `Vas a activar a ${dialogToggle?.nombre}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={motivoToggle}
              onChange={(e) => setMotivoToggle(e.target.value)}
              placeholder="Ej: Cliente inactivo hace tiempo, cambio de giro..."
              rows={3}
              disabled={procesando}
            />
          </div>

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
              disabled={procesando || motivoToggle.trim().length < 3}
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