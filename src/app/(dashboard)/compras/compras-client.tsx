'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, PackageCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { recibirOrdenCompraAction } from './actions'
import { NuevaOrdenDialog } from './nueva-orden-dialog'

export function ComprasClient({ ordenes, permisos }: { ordenes: any[], permisos: string[] }) {
  const [recibiendo, setRecibiendo] = React.useState<string | null>(null)
  const [openNueva, setOpenNueva] = React.useState(false)

  const handleRecibir = async (id: string) => {
    if (!confirm('¿Confirmar recepción de esta orden? El stock se actualizará.')) return
    setRecibiendo(id)
    const res = await recibirOrdenCompraAction(id)
    if (res.success) toast.success('Stock actualizado correctamente')
    else toast.error(res.error)
    setRecibiendo(null)
  }

  const getEstadoBadge = (estado: string) => {
    switch(estado) {
      case 'BORRADOR': return <Badge variant="secondary">Borrador</Badge>
      case 'RECIBIDA': return <Badge className="bg-green-600">Recibida</Badge>
      case 'CANCELADA': return <Badge variant="destructive">Cancelada</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setOpenNueva(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Orden
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono font-medium">{o.codigo}</TableCell>
                <TableCell>{o.proveedor}</TableCell>
                <TableCell className="text-muted-foreground">{o.fecha}</TableCell>
                <TableCell>{o.itemsCount}</TableCell>
                <TableCell className="font-bold">C$ {o.total.toFixed(2)}</TableCell>
                <TableCell>{getEstadoBadge(o.estado)}</TableCell>
                <TableCell className="text-right">
                  {o.estado === 'BORRADOR' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRecibir(o.id)}
                      disabled={recibiendo === o.id}
                    >
                      {recibiendo === o.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                      Recibir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NuevaOrdenDialog open={openNueva} onOpenChange={setOpenNueva} />
    </>
  )
}