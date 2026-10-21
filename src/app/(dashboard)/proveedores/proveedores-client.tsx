'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { guardarProveedorAction, toggleActivoProveedorAction } from './actions'

export function ProveedoresClient({ proveedores, permisos }: { proveedores: any[], permisos: string[] }) {
  const [busqueda, setBusqueda] = React.useState('')
  const [openDialog, setOpenDialog] = React.useState(false)
  const [proveedorEditar, setProveedorEditar] = React.useState<any>(null)
  const [isPending, setIsPending] = React.useState(false)

  const filtrados = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.ruc?.includes(busqueda)
  )

  const puedeEditar = permisos.includes('compras:gestionar')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    formData.set('payload', JSON.stringify(data))

    const res = await guardarProveedorAction(formData)
    if (res.success) {
      toast.success('Proveedor guardado')
      setOpenDialog(false)
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
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
          <Button onClick={() => { setProveedorEditar(null); setOpenDialog(true); }}>
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
                    {p.telefono && <div className="flex items-center gap-1"><Phone className="h-3 w-3"/> {p.telefono}</div>}
                    {p.correo && <div className="flex items-center gap-1"><Mail className="h-3 w-3"/> {p.correo}</div>}
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
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setProveedorEditar(p); setOpenDialog(true); }}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          await toggleActivoProveedorAction(p.id, !p.activo)
                        }}>
                          <Power className="mr-2 h-4 w-4"/> {p.activo ? 'Desactivar' : 'Activar'}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {proveedorEditar && <input type="hidden" name="id" value={proveedorEditar.id} />}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Nombre Legal *</label>
                <Input name="nombre" defaultValue={proveedorEditar?.nombre} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Comercial</label>
                <Input name="nombreComercial" defaultValue={proveedorEditar?.nombreComercial} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">RUC</label>
                <Input name="ruc" defaultValue={proveedorEditar?.ruc} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input name="telefono" defaultValue={proveedorEditar?.telefono} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo</label>
                <Input name="correo" type="email" defaultValue={proveedorEditar?.correo} />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input name="direccion" defaultValue={proveedorEditar?.direccion} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}