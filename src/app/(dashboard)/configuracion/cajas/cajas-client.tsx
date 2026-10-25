'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Power, Edit, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CajaFormDialog } from './caja-form-dialog'
import { toggleCajaAction } from './actions'

type Caja = {
  id: string
  nombre: string
  codigo: string
  sucursalId: string
  sucursalNombre: string
  orden: number
  activa: boolean
}

type Sucursal = {
  id: string
  nombre: string
}

type Props = {
  cajas: Caja[]
  sucursales: Sucursal[]
}

export function CajasClient({ cajas, sucursales }: Props) {
  const [openDialog, setOpenDialog] = React.useState(false)
  const [cajaEditar, setCajaEditar] = React.useState<Caja | null>(null)

  const handleToggleActiva = async (caja: Caja) => {
    const res = await toggleCajaAction(caja.id, !caja.activa)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(caja.activa ? 'Caja desactivada' : 'Caja activada')
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setCajaEditar(null); setOpenDialog(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Caja
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caja</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cajas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No hay cajas registradas. Crea la primera.
                </TableCell>
              </TableRow>
            ) : (
              cajas.map((caja) => (
                <TableRow key={caja.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      {caja.nombre}
                    </div>
                  </TableCell>
                  <TableCell>{caja.sucursalNombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{caja.codigo}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{caja.orden}</TableCell>
                  <TableCell>
                    <Badge variant={caja.activa ? 'default' : 'secondary'} className={caja.activa ? 'bg-green-600' : ''}>
                      {caja.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setCajaEditar(caja); setOpenDialog(true) }}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActiva(caja)}>
                          <Power className="mr-2 h-4 w-4" /> {caja.activa ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CajaFormDialog 
        open={openDialog} 
        onOpenChange={setOpenDialog} 
        caja={cajaEditar} 
        sucursales={sucursales} 
      />
    </>
  )
}