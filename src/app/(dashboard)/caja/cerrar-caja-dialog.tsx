'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2, Lock, ShieldAlert, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cerrarCajaAction } from './actions'
import { getSesionDetalle } from './sesion-actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sesionId: string
  cajaNombre: string
}

function SubmitButton({ disabled, hayDiferencia }: { disabled: boolean; hayDiferencia: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={hayDiferencia ? "default" : "destructive"} disabled={pending || disabled} className={hayDiferencia ? "bg-amber-600 hover:bg-amber-700" : ""}>
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : 
       hayDiferencia ? <><Clock className="mr-2 h-4 w-4" /> Solicitar Autorización</> : 
       <><Lock className="mr-2 h-4 w-4" /> Confirmar Cierre</>}
    </Button>
  )
}

export function CerrarCajaDialog({ open, onOpenChange, sesionId, cajaNombre }: Props) {
  const action = cerrarCajaAction.bind(null, sesionId)
  const [state, formAction] = useActionState(action, undefined)
  
  const [montoContado, setMontoContado] = React.useState('')
  const [montoEsperado, setMontoEsperado] = React.useState<number | null>(null)
  const [cargando, setCargando] = React.useState(false)
  const [comentario, setComentario] = React.useState('')

  React.useEffect(() => {
    if (open && sesionId) {
      setCargando(true)
      getSesionDetalle(sesionId)
        .then((data) => setMontoEsperado(data.montoEsperado))
        .catch(() => toast.error('Error al cargar datos'))
        .finally(() => setCargando(false))
    } else {
      setMontoEsperado(null)
      setMontoContado('')
      setComentario('')
    }
  }, [open, sesionId])

  const montoNum = parseFloat(montoContado) || 0
  const diferencia = montoContado && montoEsperado !== null ? montoNum - montoEsperado : 0
  const hayDiferencia = montoContado !== '' && montoEsperado !== null && Math.abs(diferencia) > 0.01

  React.useEffect(() => {
    if (state?.success) {
      if (state.error?.includes('SOLICITUD_ENVIADA')) {
        toast.warning('Solicitud enviada al administrador. Caja bloqueada.', { duration: 6000 })
      } else {
        toast.success('Caja cerrada correctamente')
      }
      onOpenChange(false)
      setTimeout(() => window.location.reload(), 1000)
    } else if (state?.error && !state.success) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-destructive" /> Cerrar Caja - {cajaNombre}</DialogTitle>
          <DialogDescription>Ingresa el efectivo físico contado.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-3 flex justify-between items-center">
            <span className="text-sm font-medium">Monto Esperado:</span>
            <span className="text-lg font-bold">
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : `C$ ${montoEsperado?.toFixed(2) || '0.00'}`}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoContado">Monto contado físicamente (C$) <span className="text-destructive">*</span></Label>
            <Input id="montoContado" name="montoContado" type="number" step="0.01" value={montoContado} onChange={(e) => setMontoContado(e.target.value)} className="text-2xl h-14 text-center font-bold" required disabled={cargando} autoFocus />
          </div>

          {hayDiferencia && (
            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                <ShieldAlert className="h-5 w-5" /> {diferencia > 0 ? 'Sobrante' : 'Faltante'} de C$ {Math.abs(diferencia).toFixed(2)}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Motivo <span className="text-destructive">*</span></Label>
                <Select name="motivoDiferencia" required>
                  <SelectTrigger><SelectValue placeholder="Selecciona un motivo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERROR_CAMBIO">Error en el cambio</SelectItem>
                    <SelectItem value="VOUCHER_OLVIDADO">Voucher olvidado</SelectItem>
                    <SelectItem value="ROBO_HURTO">Robo / Hurto</SelectItem>
                    <SelectItem value="FALLA_SISTEMA">Falla del sistema</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  Explicación (Opcional) 
                  <span className={comentario.length >= 500 ? "text-destructive font-bold" : "text-muted-foreground"}>
                    {comentario.length}/500
                  </span>
                </Label>
                <Textarea name="comentarioCajero" value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} placeholder="Explica brevemente al administrador..." rows={2} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <SubmitButton disabled={!montoContado || cargando} hayDiferencia={hayDiferencia} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}