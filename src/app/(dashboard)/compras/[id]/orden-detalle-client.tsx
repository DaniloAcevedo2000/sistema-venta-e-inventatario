'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, PackageCheck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { recibirOrdenParcialAction } from '../actions'

export function OrdenDetalleClient({ orden, permisos }: { orden: any, permisos: string[] }) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  
  // Estado local para controlar las cantidades a recibir
  const [cantidades, setCantidades] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    orden.items.forEach((i: any) => {
      // Por defecto, sugiere recibir lo que falta
      const pendiente = i.cantidadPedida - i.cantidadRecibida
      initial[i.id] = pendiente > 0 ? pendiente : 0
    })
    return initial
  })

  const puedeRecibir = permisos.includes('compras:editar') && 
    (orden.estado === 'BORRADOR' || orden.estado === 'RECIBIDA_PARCIAL')

  const handleRecibir = async () => {
    setIsPending(true)
    const res = await recibirOrdenParcialAction(orden.id, cantidades)
    
    if (res.success) {
      toast.success(res.todoRecibido ? 'Orden recibida completamente' : 'Recepción parcial registrada')
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setIsPending(false)
  }

  const getEstadoBadge = (estado: string) => {
    switch(estado) {
      case 'BORRADOR': return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>
      case 'RECIBIDA_PARCIAL': return <Badge className="bg-amber-500 gap-1"><Clock className="h-3 w-3" /> Parcial</Badge>
      case 'RECIBIDA': return <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" /> Recibida</Badge>
      case 'CANCELADA': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelada</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/compras')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Orden {orden.codigo} {getEstadoBadge(orden.estado)}
            </h1>
            <p className="text-sm text-muted-foreground">
              Creada el {orden.fecha} por {orden.creadoPor}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Datos */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Insumos Solicitados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead className="text-center">Pedido</TableHead>
                    <TableHead className="text-center">Recibido</TableHead>
                    <TableHead className="text-center">Pendiente</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orden.items.map((item: any) => {
                    const pendiente = item.cantidadPedida - item.cantidadRecibida
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.nombre}</p>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {item.cantidadPedida} {item.unidad}
                        </TableCell>
                        <TableCell className="text-center font-mono text-green-600">
                          {item.cantidadRecibida}
                        </TableCell>
                        <TableCell className="text-center font-mono text-amber-600 font-bold">
                          {pendiente}
                        </TableCell>
                        <TableCell className="text-right text-sm">C$ {item.precioUnitario.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">C$ {item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {orden.notas && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Notas</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm italic text-muted-foreground">"{orden.notas}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Info y Recepción */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Resumen Financiero</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proveedor</span>
                <span className="font-medium text-right">{orden.proveedor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sucursal</span>
                <span className="font-medium text-right">{orden.sucursal}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>C$ {orden.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span>C$ {orden.impuesto.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">C$ {orden.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Módulo de Recepción */}
          {puedeRecibir && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PackageCheck className="h-4 w-4" /> Registrar Recepción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Modifica las cantidades si el proveedor entregó menos de lo solicitado.
                </p>
                
                <div className="space-y-3">
                  {orden.items.filter((i:any) => i.cantidadPedida > i.cantidadRecibida).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs truncate flex-1">{item.nombre}</span>
                      <Input 
                        type="number"
                        min="0"
                        max={item.cantidadPedida - item.cantidadRecibida}
                        className="w-20 h-8 text-right"
                        value={cantidades[item.id]}
                        onChange={(e) => setCantidades({...cantidades, [item.id]: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleRecibir} 
                  disabled={isPending || Object.values(cantidades).every(c => c === 0)}
                >
                  {isPending ? 'Procesando...' : 'Confirmar Recepción'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}