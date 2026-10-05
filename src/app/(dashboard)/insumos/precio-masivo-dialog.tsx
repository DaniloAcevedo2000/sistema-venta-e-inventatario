'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, Calculator, DollarSign } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { actualizarPreciosMasivoAction } from './actions'

type Insumo = {
  id: string
  codigo: string
  nombre: string
  costoUnitario: string
  unidadMedida: { abreviatura: string }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  insumosSeleccionados: Insumo[]
}

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Aplicando...' : `Aplicar a ${count} insumo${count !== 1 ? 's' : ''}`}
    </Button>
  )
}

export function PrecioMasivoDialog({ open, onOpenChange, insumosSeleccionados }: Props) {
  const [tipo, setTipo] = React.useState<'porcentaje' | 'monto_fijo'>('porcentaje')
  const [operacion, setOperacion] = React.useState<'aumentar' | 'disminuir' | 'establecer'>('aumentar')
  const [valor, setValor] = React.useState('')

  const [state, formAction] = useActionState(actualizarPreciosMasivoAction, undefined)

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Precios actualizados correctamente')
      onOpenChange(false)
      setValor('')
    }
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  const handleSubmit = (formData: FormData) => {
    const payload = {
      insumoIds: insumosSeleccionados.map((i) => i.id),
      tipo,
      valor: parseFloat(valor) || 0,
      operacion,
    }
    formData.set('payload', JSON.stringify(payload))
    return formAction(formData)
  }

  // Preview del cálculo
  const previewCalculo = () => {
    const v = parseFloat(valor) || 0
    if (v === 0 || insumosSeleccionados.length === 0) return null

    return insumosSeleccionados.slice(0, 3).map((insumo) => {
      const costoActual = parseFloat(insumo.costoUnitario)
      let nuevoCosto = costoActual

      if (operacion === 'establecer') {
        nuevoCosto = v
      } else if (tipo === 'porcentaje') {
        const delta = (costoActual * v) / 100
        nuevoCosto = operacion === 'aumentar' ? costoActual + delta : costoActual - delta
      } else {
        nuevoCosto = operacion === 'aumentar' ? costoActual + v : costoActual - v
      }

      return {
        nombre: insumo.nombre,
        abreviatura: insumo.unidadMedida.abreviatura,
        anterior: costoActual,
        nuevo: Math.max(0, nuevoCosto),
      }
    })
  }

  const preview = previewCalculo()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Actualización Masiva de Precios
          </DialogTitle>
          <DialogDescription>
            Vas a actualizar los precios de{' '}
            <strong>{insumosSeleccionados.length} insumo(s)</strong> seleccionado(s).
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de actualización</Label>
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="porcentaje" id="tipo-porcentaje" />
                <Label htmlFor="tipo-porcentaje" className="font-normal cursor-pointer">
                  Porcentaje (%)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monto_fijo" id="tipo-monto" />
                <Label htmlFor="tipo-monto" className="font-normal cursor-pointer">
                  Monto fijo (C$)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Operación</Label>
            <RadioGroup value={operacion} onValueChange={(v) => setOperacion(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aumentar" id="op-aumentar" />
                <Label htmlFor="op-aumentar" className="font-normal cursor-pointer flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Aumentar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disminuir" id="op-disminuir" />
                <Label htmlFor="op-disminuir" className="font-normal cursor-pointer flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Disminuir
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="establecer" id="op-establecer" />
                <Label htmlFor="op-establecer" className="font-normal cursor-pointer flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Establecer valor fijo
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">
              {tipo === 'porcentaje' ? 'Porcentaje (%)' : 'Monto (C$)'}
            </Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej: 10"
              required
            />
          </div>

          {preview && preview.length > 0 && (
            <Alert className="bg-primary/5 border-primary/20">
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <p className="font-medium text-sm">Vista previa:</p>
                  {preview.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate">{p.nombre}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground line-through">
                          C$ {p.anterior.toFixed(2)}
                        </span>
                        <span>→</span>
                        <strong>C$ {p.nuevo.toFixed(2)}</strong>
                      </span>
                    </div>
                  ))}
                  {insumosSeleccionados.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      ...y {insumosSeleccionados.length - 3} más
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <SubmitButton count={insumosSeleccionados.length} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}