'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, MoreHorizontal, Pencil, Power, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toggleActivoSucursalAction } from './actions'

type SucursalRow = {
  id: string
  codigo: string
  nombre: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  activa: boolean
  cajasCount: number
  ventasCount: number
  usuariosCount: number
}

export function SucursalesTable({ sucursales }: { sucursales: SucursalRow[] }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = React.useState('')

  const filtradas = sucursales.filter(s => 
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    s.codigo.toLowerCase().includes(busqueda.toLowerCase())
  )

  const toggleActivo = async (id: string) => {
    const res = await toggleActivoSucursalAction(id)
    if (res.success) {
      toast.success('Estado actualizado')
      window.location.reload()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Sucursal</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Operación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length ? (
              filtradas.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.nombre}</p>
                        <p className="text-xs text-muted-foreground">{s.codigo} • {s.direccion || 'Sin dirección'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {s.telefono && <div className="flex items-center gap-1"><Phone className="h-3 w-3"/> {s.telefono}</div>}
                      {s.correo && <div className="flex items-center gap-1"><Mail className="h-3 w-3"/> {s.correo}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{s.cajasCount} cajas</Badge>
                      <Badge variant="outline" className="text-xs">{s.ventasCount} ventas</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.activa ? 'default' : 'secondary'}>
                      {s.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => router.push(`/sucursales/${s.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleActivo(s.id)}>
                          <Power className="mr-2 h-4 w-4" /> 
                          {s.activa ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron sucursales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}