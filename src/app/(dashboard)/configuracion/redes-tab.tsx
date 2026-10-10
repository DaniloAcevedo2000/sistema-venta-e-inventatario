'use client'

import * as React from 'react'
import { Plus, Edit, Power, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RedFormDialog } from './red-form-dialog'
import { toggleRedTarjetaAction } from './actions'

type RedTarjeta = {
  id: string
  codigo: string
  nombre: string
  orden: number
  activo: boolean
}

export function RedesTab({ redesTarjeta }: { redesTarjeta: RedTarjeta[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [redEditar, setRedEditar] = React.useState<RedTarjeta | null>(null)

  const handleToggle = async (red: RedTarjeta) => {
    const result = await toggleRedTarjetaAction(red.id)
    if (result.success) {
      toast.success(red.activo ? 'Red desactivada' : 'Red activada')
      window.location.reload()
    } else {
      toast.error(result.error || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Redes de Tarjeta</h2>
          <p className="text-sm text-muted-foreground">
            Redes aceptadas al cobrar con tarjeta
          </p>
        </div>
        <Button
          onClick={() => {
            setRedEditar(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva red
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center">Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redesTarjeta.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay redes configuradas
                </TableCell>
              </TableRow>
            ) : (
              redesTarjeta.map((red) => (
                <TableRow key={red.id}>
                  <TableCell className="font-mono text-xs">
                    {red.codigo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="rounded bg-primary/10 p-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{red.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {red.orden}
                  </TableCell>
                  <TableCell>
                    {red.activo ? (
                      <Badge className="bg-green-600">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setRedEditar(red)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          red.activo ? 'text-destructive' : 'text-green-600'
                        }`}
                        onClick={() => handleToggle(red)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RedFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        red={redEditar}
      />
    </div>
  )
}