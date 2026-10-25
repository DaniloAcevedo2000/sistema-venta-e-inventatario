// src/app/(dashboard)/caja/autorizaciones/autorizaciones-client.tsx
'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, FileSearch } from 'lucide-react'
import { resolverAutorizacionCajaAction } from '../actions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'


type Pendiente = {
  id: string
  caja: { nombre: string; codigo: string }
  usuarioApertura: { nombre: string }
  montoInicial: number
  montoFinal: number | null
  montoEsperado: number | null
  diferencia: number
  motivoDiferencia: string | null
  comentarioCajero: string | null
  fechaSolicitudAutorizacion: string | null
}

function Btn({ label, icon, variant, disabled }: any) {
  const { pending } = useFormStatus()
  return <Button type="submit" variant={variant} disabled={pending || disabled}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon} {label}</Button>
}

export function AutorizacionesClient({ pendientes }: { pendientes: Pendiente[] }) {
  const [selected, setSelected] = React.useState<Pendiente | null>(null)
  const [comentario, setComentario] = React.useState('')

  // Función segura para formatear fecha (evita errores de hidratación)
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caja / Cajero</TableHead>
              <TableHead>Fecha Solicitud</TableHead>
              <TableHead>Diferencia</TableHead>
              <TableHead>Motivo Cajero</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendientes.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay autorizaciones pendientes</TableCell></TableRow>
            ) : (
              pendientes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-semibold">{p.caja.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.usuarioApertura.nombre}</p>
                  </TableCell>
                  <TableCell className="text-xs" suppressHydrationWarning>
                    {formatDate(p.fechaSolicitudAutorizacion)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.diferencia > 0 ? 'default' : 'destructive'} className={p.diferencia > 0 ? 'bg-amber-600' : ''}>
                      {p.diferencia > 0 ? '+' : ''} C$ {p.diferencia.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{p.motivoDiferencia}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => { setSelected(p); setComentario('') }}>
                      <FileSearch className="mr-2 h-4 w-4" /> Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selected && <ModalResolucion pendiente={selected} onClose={() => setSelected(null)} comentario={comentario} setComentario={setComentario} />}
    </>
  )
}

function ModalResolucion({ pendiente, onClose, comentario, setComentario }: any) {
  const aprobarAction = resolverAutorizacionCajaAction.bind(null, pendiente.id, true)
  const rechazarAction = resolverAutorizacionCajaAction.bind(null, pendiente.id, false)
  
  const [stateAprobar, formAprobar] = useActionState(aprobarAction, undefined)
  const [stateRechazar, formRechazar] = useActionState(rechazarAction, undefined)

  React.useEffect(() => {
    if (stateAprobar?.success) { toast.success('Caja aprobada y cerrada'); onClose(); window.location.reload() }
    if (stateRechazar?.success) { toast.error('Cierre rechazado'); onClose(); window.location.reload() }
    if (stateAprobar?.error || stateRechazar?.error) toast.error(stateAprobar?.error || stateRechazar?.error)
  }, [stateAprobar, stateRechazar, onClose])

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolver Autorización - {pendiente.caja.nombre}</DialogTitle>
          <DialogDescription>Revisa los detalles antes de aprobar o rechazar.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
            <p><strong>Cajero:</strong> {pendiente.usuarioApertura.nombre}</p>
            <p><strong>Motivo:</strong> {pendiente.motivoDiferencia}</p>
            <p><strong>Comentario Cajero:</strong> {pendiente.comentarioCajero || 'Ninguno'}</p>
            <p className="text-destructive font-bold">Diferencia: C$ {pendiente.diferencia.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between">Comentario de Resolución <span className={comentario.length >= 500 ? "text-destructive" : "text-muted-foreground"}>{comentario.length}/500</span></Label>
            <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} placeholder="Explica por qué apruebas o rechazas..." />
            <input type="hidden" name="comentarioAutorizador" value={comentario} form="form-rechazar" />
            <input type="hidden" name="comentarioAutorizador" value={comentario} form="form-aprobar" />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <form id="form-rechazar" action={formRechazar}>
            <Btn label="Rechazar" icon={<XCircle className="mr-2 h-4 w-4" />} variant="destructive" />
          </form>
          <form id="form-aprobar" action={formAprobar}>
            <Btn label="Aprobar y Cerrar" icon={<CheckCircle2 className="mr-2 h-4 w-4" />} variant="default" disabled={!comentario} />
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}