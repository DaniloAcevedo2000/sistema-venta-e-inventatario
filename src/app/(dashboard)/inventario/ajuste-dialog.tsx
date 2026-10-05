'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Calculator, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ajustarStockInsumoAction,
  ajustarStockProductoAction,
} from './actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: 'insumo' | 'producto'
  item: {
    id: string
    nombre: string
    codigo: string
    sucursalId: string
    sucursalNombre: string
    stockActual: number
    unidadAbreviatura: string
  } | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Ajustando...' : 'Confirmar Ajuste'}
    </Button>
  )
}

export function AjusteDialog({ open, onOpenChange, tipo, item }: Props) {
  const [tipoAjuste, setTipoAjuste] = React.useState<'establecer' | 'sumar' | 'restar'>('establecer')
  const [cantidad, setCantidad] = React.useState('')
  const [motivo, setMotivo] = React.useState('')

  const action = tipo === 'insumo' ? ajustarStockInsumoAction : ajustarStockProductoAction
  const [state, formAction] = useActionState(action, undefined)

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Stock ajustado correctamente')
      onOpenChange(false)
      setCantidad('')
      setMotivo('')
      setTipoAjuste('establecer')
    }
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  const handleSubmit = (formData: FormData) => {
    if (!item) return
    const payload = {
      [`${tipo}Id`]: item.id,
      sucursalId: item.sucursalId,
      tipoAjuste,
      cantidad,
      motivo,
    }
    formData.set('payload', JSON.stringify(payload))
    return formAction(formData)
  }

  // Preview del cálculo
  const preview = () => {
    if (!item || !cantidad) return null
    const cant = parseFloat(cantidad)
    if (isNaN(cant)) return null

    let nueva = item.stockActual
    if (tipoAjuste === 'establecer') nueva = cant
    if (tipoAjuste === 'sumar') nueva = item.stockActual + cant
    if (tipoAjuste === 'restar') nueva = Math.max(0, item.stockActual - cant)

    return { anterior: item.stockActual, nueva }
  }

  const previewData = preview()

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ajustar Stock
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{item.codigo}</span> — {item.nombre}
            <br />
            <span className="text-xs">
              Sucursal: <strong>{item.sucursalNombre}</strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-3 text-sm">
          <span className="text-muted-foreground">Stock actual:</span>{' '}
          <strong className="text-lg">
            {item.stockActual.toFixed(2)} {item.unidadAbreviatura}
          </strong>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de ajuste</Label>
            <RadioGroup value={tipoAjuste} onValueChange={(v) => setTipoAjuste(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="establecer" id="ajuste-establecer" />
                <Label htmlFor="ajuste-establecer" className="font-normal cursor-pointer flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Establecer valor exacto
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sumar" id="ajuste-sumar" />
                <Label htmlFor="ajuste-sumar" className="font-normal cursor-pointer flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Sumar cantidad
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="restar" id="ajuste-restar" />
                <Label htmlFor="ajuste-restar" className="font-normal cursor-pointer flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Restar cantidad
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad">
              Cantidad <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="cantidad"
                type="number"
                step="0.01"
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0.00"
                required
              />
              <div className="flex items-center px-3 rounded-md border bg-muted text-sm min-w-[60px] justify-center">
                {item.unidadAbreviatura}
              </div>
            </div>
          </div>

          {previewData && (
            <Alert className="bg-primary/5 border-primary/20">
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Stock actual:</span>
                  <span className="line-through">
                    {previewData.anterior.toFixed(2)}
                  </span>
                  <span>→</span>
                  <strong className="text-base">
                    {previewData.nueva.toFixed(2)} {item.unidadAbreviatura}
                  </strong>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo del ajuste <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Corrección de inventario físico, merma por vencimiento, conteo inicial..."
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Este motivo queda registrado en la auditoría del sistema.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}