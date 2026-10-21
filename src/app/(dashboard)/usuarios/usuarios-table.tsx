'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserCog, Shield, Building2 } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'

type UsuarioRow = {
  id: string
  nombre: string
  correo: string
  telefono: string | null
  sucursalNombre: string
  rolesNombres: string
  activo: boolean
}

type Props = {
  usuarios: UsuarioRow[]
  roles: { id: string; nombre: string }[]
  sucursales: { id: string; nombre: string }[]
}

export function UsuariosTable({ usuarios, roles, sucursales }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = React.useState('')
  const [filtroSucursal, setFiltroSucursal] = React.useState('all')
  const [filtroEstado, setFiltroEstado] = React.useState('all')

  const filtrados = usuarios.filter(u => {
    const matchBusqueda = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.correo.toLowerCase().includes(busqueda.toLowerCase())
    const matchSucursal = filtroSucursal === 'all' || u.sucursalNombre === filtroSucursal
    const matchEstado = filtroEstado === 'all' || (filtroEstado === 'activos' ? u.activo : !u.activo)
    return matchBusqueda && matchSucursal && matchEstado
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        
        <Select value={filtroSucursal} onValueChange={setFiltroSucursal}>
          <SelectTrigger className="w-[200px] bg-white">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sucursal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {sucursales.map(s => (
              <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Usuario</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length ? (
              filtrados.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{u.nombre}</p>
                        <p className="text-xs text-muted-foreground">{u.correo}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.telefono || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.sucursalNombre}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" /> {u.rolesNombres}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.activo ? 'default' : 'secondary'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/usuarios/${u.id}`)}
                      className="h-7 text-xs"
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}