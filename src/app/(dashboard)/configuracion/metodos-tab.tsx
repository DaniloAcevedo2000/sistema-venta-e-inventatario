'use client'

import * as React from 'react'
import * as Icons from 'lucide-react'
import { Plus, Edit, Power, Wallet } from 'lucide-react'
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
import { MetodoFormDialog } from './metodo-form-dialog'
import { toggleMetodoPagoAction } from './actions'

type MetodoPago = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: string
  requiereBanco: boolean
  requiereRed: boolean
  requiereReferencia: boolean
  esCredito: boolean
  icono: string | null
  orden: number
  activo: boolean
}

const LABELS_TIPO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
}

export function MetodosTab({ metodosPago }: { metodosPago: MetodoPago[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [metodoEditar, setMetodoEditar] = React.useState<MetodoPago | null>(null)

  const handleToggle = async (metodo: MetodoPago) => {
    const result = await toggleMetodoPagoAction(metodo.id)
    if (result.success) {
      toast.success(
        metodo.activo ? 'Método desactivado' : 'Método activado'
      )
      window.location.reload()
    } else {
      toast.error(result.error || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Métodos de Pago</h2>
          <p className="text-sm text-muted-foreground">
            Formas de pago disponibles en el POS
          </p>
        </div>
        <Button
          onClick={() => {
            setMetodoEditar(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo método
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Requisitos</TableHead>
              <TableHead className="text-center">Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metodosPago.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay métodos de pago
                </TableCell>
              </TableRow>
            ) : (
              metodosPago.map((metodo) => {
                const Icon = metodo.icono
                  ? (Icons[metodo.icono as keyof typeof Icons] as React.ComponentType<{ className?: string }>)
                  : Wallet

                return (
                  <TableRow key={metodo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-primary/10 p-1.5">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{metodo.nombre}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {metodo.codigo}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {LABELS_TIPO[metodo.tipo] ?? metodo.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {metodo.requiereBanco && (
                          <Badge variant="secondary" className="text-xs">
                            Banco
                          </Badge>
                        )}
                        {metodo.requiereRed && (
                          <Badge variant="secondary" className="text-xs">
                            Red
                          </Badge>
                        )}
                        {metodo.requiereReferencia && (
                          <Badge variant="secondary" className="text-xs">
                            Referencia
                          </Badge>
                        )}
                        {metodo.esCredito && (
                          <Badge variant="secondary" className="text-xs">
                            Crédito
                          </Badge>
                        )}
                        {!metodo.requiereBanco &&
                          !metodo.requiereRed &&
                          !metodo.requiereReferencia &&
                          !metodo.esCredito && (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {metodo.orden}
                    </TableCell>
                    <TableCell>
                      {metodo.activo ? (
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
                            setMetodoEditar(metodo)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            metodo.activo
                              ? 'text-destructive'
                              : 'text-green-600'
                          }`}
                          onClick={() => handleToggle(metodo)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <MetodoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        metodo={metodoEditar}
      />
    </div>
  )
}