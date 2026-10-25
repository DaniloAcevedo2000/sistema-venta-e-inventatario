'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { guardarCajaAction } from './actions'

type Caja = {
  id: string
  nombre: string
  codigo: string
  sucursalId: string
  orden: number
}

type Sucursal = {
  id: string
  nombre: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  caja: Caja | null
  sucursales: Sucursal[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Caja'}
    </Button>
  )
}

export function CajaFormDialog({ open, onOpenChange, caja, sucursales }: Props) {
  const action = guardarCajaAction.bind(null, caja?.id || null)
  const [state, formAction] = useActionState(action, undefined)

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Caja guardada correctamente')
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{caja ? 'Editar Caja' : 'Nueva Caja'}</DialogTitle>
          <DialogDescription>
            {caja ? 'Modifica los datos de la caja.' : 'Registra una nueva caja para una sucursal.'}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Sucursal <span className="text-destructive">*</span></Label>
            <Select name="sucursalId" defaultValue={caja?.sucursalId} required>
              <SelectTrigger><SelectValue placeholder="Selecciona una sucursal" /></SelectTrigger>
              <SelectContent>
                {sucursales.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre <span className="text-destructive">*</span></Label>
              <Input id="nombre" name="nombre" defaultValue={caja?.nombre} placeholder="Ej: Caja 1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código <span className="text-destructive">*</span></Label>
              <Input id="codigo" name="codigo" defaultValue={caja?.codigo} placeholder="Ej: C1" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orden">Orden de visualización</Label>
            <Input id="orden" name="orden" type="number" defaultValue={caja?.orden || 0} />
            <p className="text-xs text-muted-foreground">Un número menor aparecerá primero en la lista del POS.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}