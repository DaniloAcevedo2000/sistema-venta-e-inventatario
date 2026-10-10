'use client'

import * as React from 'react'
import {
  Plus,
  Building2,
  Edit,
  Power,
  CreditCard,
  Landmark,
} from 'lucide-react'
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
import { BancoFormDialog } from './banco-form-dialog'
import { toggleBancoAction } from './actions'

type Banco = {
  id: string
  codigo: string
  nombre: string
  nombreCorto: string | null
  permiteTarjeta: boolean
  permiteTransferencia: boolean
  orden: number
  activo: boolean
}

export function BancosTab({ bancos }: { bancos: Banco[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [bancoEditar, setBancoEditar] = React.useState<Banco | null>(null)

  const handleToggle = async (banco: Banco) => {
    const result = await toggleBancoAction(banco.id)
    if (result.success) {
      toast.success(banco.activo ? 'Banco desactivado' : 'Banco activado')
      window.location.reload()
    } else {
      toast.error(result.error || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bancos</h2>
          <p className="text-sm text-muted-foreground">
            Bancos disponibles para tarjeta y transferencia
          </p>
        </div>
        <Button
          onClick={() => {
            setBancoEditar(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo banco
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead className="text-center">Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bancos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay bancos configurados
                </TableCell>
              </TableRow>
            ) : (
              bancos.map((banco) => (
                <TableRow key={banco.id}>
                  <TableCell className="font-mono text-xs">
                    {banco.codigo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="rounded bg-primary/10 p-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{banco.nombre}</p>
                        {banco.nombreCorto && (
                          <p className="text-xs text-muted-foreground">
                            {banco.nombreCorto}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {banco.permiteTarjeta && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <CreditCard className="h-3 w-3" />
                          Tarjeta
                        </Badge>
                      )}
                      {banco.permiteTransferencia && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Landmark className="h-3 w-3" />
                          Transferencia
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {banco.orden}
                  </TableCell>
                  <TableCell>
                    {banco.activo ? (
                      <Badge className="bg-green-600">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setBancoEditar(banco)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          banco.activo ? 'text-destructive' : 'text-green-600'
                        }`}
                        onClick={() => handleToggle(banco)}
                        title={banco.activo ? 'Desactivar' : 'Activar'}
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

      <BancoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banco={bancoEditar}
      />
    </div>
  )
}