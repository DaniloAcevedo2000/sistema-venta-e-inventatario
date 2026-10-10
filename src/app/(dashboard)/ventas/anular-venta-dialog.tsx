'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Loader2,
  Package,
  FileText,
  DollarSign,
  CreditCard,
  Building2,
  Wallet,
  XCircle,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { anularVentaAction } from './actions'
import type { VentaRow } from './columnas'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: VentaRow | null
  permisos: string[]
  onSuccess?: (notaCreditoNumero?: string) => void
}

type ActionState = {
  success: boolean
  error?: string
  notaCreditoNumero?: string
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending || disabled}
      className="gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Anulando...
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4" />
          Confirmar anulación
        </>
      )}
    </Button>
  )
}

export function AnularVentaDialog({
  open,
  onOpenChange,
  venta,
  permisos,
  onSuccess,
}: Props) {
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    async (prev, formData) => {
      if (!venta) return { success: false }
      return anularVentaAction({
        ventaId: venta.id,
        motivo: formData.get('motivo') as string,
        devolverAlInventario: formData.get('devolverAlInventario') === 'on',
        generarNotaCredito: formData.get('generarNotaCredito') === 'on',
        metodoDevolucion: formData.get('metodoDevolucion') as any,
        referenciaDevolucion:
          (formData.get('referenciaDevolucion') as string) || undefined,
      })
    },
    undefined
  )

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Venta anulada correctamente', {
        description: state.notaCreditoNumero
          ? `Nota de crédito: ${state.notaCreditoNumero}`
          : undefined,
      })
      onOpenChange(false)
      onSuccess?.(state.notaCreditoNumero)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange, onSuccess])

  if (!venta) return null

  // Verificar si es del mismo día
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaVenta = new Date(venta.fechaISO)
  fechaVenta.setHours(0, 0, 0, 0)
  const esMismoDia = fechaVenta.getTime() === hoy.getTime()

  const puedeAnularHistorico = permisos.includes('ventas:anular_historico')
  const puedeAnular = esMismoDia || puedeAnularHistorico

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Anular Venta
          </DialogTitle>
          <DialogDescription>
            Esta acción es irreversible y quedará registrada en la auditoría del
            sistema.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Info de la venta */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-semibold">{venta.numero}</p>
                <p className="text-xs text-muted-foreground">
                  Factura {venta.facturaNumero ?? '—'} · {venta.fecha}{' '}
                  {venta.hora}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">
                  C$ {venta.total.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline">{venta.cantidadItems} items</Badge>
              <Badge variant="outline">{venta.metodoPago}</Badge>
              {venta.banco && (
                <Badge variant="outline">
                  {venta.banco}
                  {venta.redTarjeta ? ` · ${venta.redTarjeta}` : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Aviso si no es del mismo día */}
          {!esMismoDia && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {puedeAnularHistorico ? (
                  <>
                    Esta venta es del <strong>{venta.fecha}</strong>. Al
                    anularla, se registrará la fecha y el usuario que autorizó
                    la operación.
                  </>
                ) : (
                  <>
                    No puedes anular ventas de días anteriores. Solo
                    SUPER_ADMIN puede hacerlo.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo de anulación <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              name="motivo"
              placeholder="Ej: Error en el cobro, el cliente canceló, se cobró el producto equivocado..."
              rows={3}
              required
              minLength={10}
              disabled={!puedeAnular}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres. Este motivo quedará en la auditoría.
            </p>
          </div>

          {/* Devolver al inventario */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="devolverAlInventario"
                name="devolverAlInventario"
                defaultChecked
                disabled={!puedeAnular}
              />
              <div className="flex-1">
                <Label
                  htmlFor="devolverAlInventario"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Package className="h-4 w-4 text-primary" />
                  Devolver productos al inventario
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Marca esta opción si el cliente <strong>NO consumió</strong>{' '}
                  los productos. Los insumos volverán al stock según receta.
                </p>
              </div>
            </div>
          </div>

          {/* Nota de crédito */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="generarNotaCredito"
                name="generarNotaCredito"
                defaultChecked
                disabled={!puedeAnular || !venta.facturaId}
              />
              <div className="flex-1">
                <Label
                  htmlFor="generarNotaCredito"
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    !venta.facturaId && 'opacity-50'
                  )}
                >
                  <FileText className="h-4 w-4 text-primary" />
                  Generar Nota de Crédito
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {venta.facturaId
                    ? 'Se emitirá un documento fiscal que reduce el monto de la factura original. Requerido por la DGI.'
                    : 'Esta venta no tiene factura asociada, no se puede generar nota de crédito.'}
                </p>
              </div>
            </div>
          </div>

          {/* Método de devolución del dinero */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Método de devolución del dinero
            </Label>
            <p className="text-xs text-muted-foreground">
              ¿Cómo se le devolverá el dinero al cliente?
            </p>

            <Select
              name="metodoDevolucion"
              defaultValue="EFECTIVO"
              disabled={!puedeAnular}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Efectivo
                  </div>
                </SelectItem>
                <SelectItem value="TRANSFERENCIA">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Transferencia bancaria
                  </div>
                </SelectItem>
                <SelectItem value="TARJETA">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Reverso en tarjeta
                  </div>
                </SelectItem>
                <SelectItem value="SALDO_A_FAVOR">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Saldo a favor del cliente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label htmlFor="referenciaDevolucion" className="text-xs">
                Referencia (opcional)
              </Label>
              <input
                type="text"
                id="referenciaDevolucion"
                name="referenciaDevolucion"
                placeholder="Ej: Número de transferencia, voucher, etc."
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
                disabled={!puedeAnular}
              />
            </div>
          </div>

          <Separator />

          {/* Resumen de lo que va a pasar */}
          {puedeAnular && (
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <XCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-200">
                <strong>Al confirmar:</strong>
                <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                  <li>La venta quedará marcada como ANULADA</li>
                  <li>La factura será anulada</li>
                  <li>
                    Se registrará el motivo y quién anuló (auditoría)
                  </li>
                  <li>El dinero se devolverá según el método elegido</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <SubmitButton disabled={!puedeAnular} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}