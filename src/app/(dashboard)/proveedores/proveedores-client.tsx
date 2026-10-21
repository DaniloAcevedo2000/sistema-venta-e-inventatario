'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Phone, Mail, MoreHorizontal, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { crearProveedorAction, actualizarProveedorAction, toggleActivoProveedorAction } from './actions'

interface Proveedor {
  id: string
  nombre: string
  nombreComercial?: string | null
  ruc?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  codigo?: string
  activo: boolean
  _count: { ordenes: number }
}

type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const initialState: ActionState = {}

export function ProveedoresClient({
  proveedores,
  permisos,
}: {
  proveedores: Proveedor[]
  permisos: string[]
}) {
  const [busqueda, setBusqueda] = React.useState('')
  const [openDialog, setOpenDialog] = React.useState(false)
  const [proveedorEditar, setProveedorEditar] = React.useState<Proveedor | null>(null)

  const puedeEditar = permisos.includes('compras:gestionar')

  // Creamos una action unificada: si hay proveedorEditar, bindeamos el id
  // para que la firma quede (prevState, formData) como espera useActionState.
  const actionParaForm = React.useMemo(() => {
    if (proveedorEditar) {
      return actualizarProveedorAction.bind(null, proveedorEditar.id)
    }
    return crearProveedorAction
  }, [proveedorEditar])

  const [state, formAction, isPending] = useActionState(actionParaForm, initialState)

  // Mostrar errores del servidor (validación o error general)
  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
    if (state?.fieldErrors) {
      const firstError = Object.values(state.fieldErrors).flat()[0]
      if (firstError) toast.error(firstError)
    }
  }, [state])

  const filtrados = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.ruc?.includes(busqueda)
  )

  const handleToggleActivo = async (p: Proveedor) => {
    const res = await toggleActivoProveedorAction(p.id, !p.activo)
    if (res?.error) toast.error(res.error)
    else toast.success(p.activo ? 'Proveedor desactivado' : 'Proveedor activado')
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o RUC..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        {puedeEditar && (
          <Button onClick={() => { setProveedorEditar(null); setOpenDialog(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Órdenes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.nombreComercial || p.codigo}</p>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {p.telefono && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.telefono}</div>}
                    {p.correo && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.correo}</div>}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.ruc || '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p._count.ordenes}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={p.activo ? 'default' : 'secondary'}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {puedeEditar && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setProveedorEditar(p); setOpenDialog(true) }}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActivo(p)}>
                          <Power className="mr-2 h-4 w-4" /> {p.activo ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay proveedores registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{proveedorEditar ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          {/* key fuerza a remontar el form al cambiar entre crear/editar */}
          <form key={proveedorEditar?.id ?? 'nuevo'} action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Nombre Legal *</label>
                <Input name="nombre" defaultValue={proveedorEditar?.nombre ?? ''} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Comercial</label>
                <Input name="nombreComercial" defaultValue={proveedorEditar?.nombreComercial ?? ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">RUC</label>
                <Input name="ruc" defaultValue={proveedorEditar?.ruc ?? ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input name="telefono" defaultValue={proveedorEditar?.telefono ?? ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo</label>
                <Input name="correo" type="email" defaultValue={proveedorEditar?.correo ?? ''} />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input name="direccion" defaultValue={proveedorEditar?.direccion ?? ''} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}