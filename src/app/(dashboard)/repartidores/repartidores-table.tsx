'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Power,
  Truck,
  Phone,
  Mail,
  Users,
  PackageCheck,
} from 'lucide-react'
import { toast } from 'sonner'
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RepartidorFormDialog } from './repartidor-form-dialog'
import { toggleRepartidorAction } from './actions'

type Repartidor = {
  id: string
  nombre: string
  correo: string
  telefono: string | null
  activo: boolean
  sucursalId: string | null
  sucursalNombre: string | null
  cantidadPedidos: number
}

type Sucursal = {
  id: string
  nombre: string
}

type Stats = {
  total: number
  activos: number
  totalPedidos: number
}

type Props = {
  repartidores: Repartidor[]
  sucursales: Sucursal[]
  permisos: string[]
  stats: Stats
}

export function RepartidoresTable({
  repartidores,
  sucursales,
  permisos,
  stats,
}: Props) {
  const [search, setSearch] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editar, setEditar] = React.useState<Repartidor | null>(null)

  const puedeCrear = permisos.includes('usuarios:crear')
  const puedeEditar = permisos.includes('usuarios:editar')

  const filtrados = repartidores.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.nombre.toLowerCase().includes(q) ||
      r.correo.toLowerCase().includes(q) ||
      (r.telefono ?? '').includes(q)
    )
  })

  const handleToggle = async (r: Repartidor) => {
    const result = await toggleRepartidorAction(r.id)
    if (result.success) {
      toast.success(r.activo ? 'Repartidor desactivado' : 'Repartidor activado')
      window.location.reload()
    } else {
      toast.error(result.error || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
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
                  <p className="text-xs text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">{stats.activos}</p>
                </div>
                <Truck className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pedidos entregados
                  </p>
                  <p className="text-2xl font-bold">{stats.totalPedidos}</p>
                </div>
                <PackageCheck className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {puedeCrear && (
          <Button
            onClick={() => {
              setEditar(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Repartidor
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repartidor</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No hay repartidores registrados</p>
                  <p className="text-sm">
                    Crea el primer repartidor para empezar
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{r.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      <p className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {r.correo}
                      </p>
                      {r.telefono && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {r.telefono}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.sucursalNombre ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{r.cantidadPedidos}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.activo ? (
                      <Badge className="bg-green-600">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {puedeEditar && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditar(r)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(r)}>
                              <Power className="mr-2 h-4 w-4" />
                              {r.activo ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RepartidorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        repartidor={editar}
        sucursales={sucursales}
      />
    </div>
  )
}