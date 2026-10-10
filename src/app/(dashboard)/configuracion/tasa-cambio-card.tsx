'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Loader2,
  History,
  ChevronDown,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { actualizarTasaCambioAction } from './actions'

type Tasa = {
  id: string
  tasa: number
  vigenteDesde: string
  fuente: string
  notas: string | null
}

type HistorialTasa = Tasa & {
  vigenteHasta: string | null
  activa: boolean
}

type Props = {
  tasaActual: Tasa | null
  historialTasas: HistorialTasa[]
}

function formatearFecha(fechaISO: string) {
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fechaISO))
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Actualizando...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar tasa
        </>
      )}
    </Button>
  )
}

export function TasaCambioCard({ tasaActual, historialTasas }: Props) {
  const [editarOpen, setEditarOpen] = React.useState(false)
  const [historialOpen, setHistorialOpen] = React.useState(false)

  const [state, formAction] = useActionState(
    actualizarTasaCambioAction,
    undefined
  )

  React.useEffect(() => {
    if (state?.success) {
      toast.success('Tasa de cambio actualizada')
      setEditarOpen(false)
      window.location.reload()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Tasa de cambio actual (USD → NIO)
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-bold text-primary">
                    C$ {tasaActual?.tasa.toFixed(4) ?? '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">/ USD</p>
                </div>
                {tasaActual && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Vigente desde {formatearFecha(tasaActual.vigenteDesde)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setHistorialOpen(true)}
              >
                <History className="mr-2 h-4 w-4" />
                Historial
              </Button>
              <Button onClick={() => setEditarOpen(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar tasa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog editar */}
      <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Actualizar Tasa de Cambio
            </DialogTitle>
            <DialogDescription>
              La nueva tasa se aplicará a todas las ventas futuras. La tasa
              anterior quedará en el historial.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tasa">
                Nueva tasa (C$ por USD){' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tasa"
                name="tasa"
                type="number"
                step="0.0001"
                min="0.0001"
                defaultValue={tasaActual?.tasa ?? ''}
                placeholder="36.6243"
                className="text-2xl h-14 text-center font-bold"
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                Tasa oficial del BCN o la que utilices en tu negocio
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                name="notas"
                placeholder="Ej: Actualización oficial del BCN, ajuste por inflación..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditarOpen(false)}
              >
                Cancelar
              </Button>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog historial */}
      <Dialog open={historialOpen} onOpenChange={setHistorialOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Tasa de Cambio
            </DialogTitle>
            <DialogDescription>
              Últimos {historialTasas.length} cambios registrados
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tasa</TableHead>
                  <TableHead>Vigente desde</TableHead>
                  <TableHead>Vigente hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialTasas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground h-24"
                    >
                      No hay historial
                    </TableCell>
                  </TableRow>
                ) : (
                  historialTasas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono font-medium">
                        C$ {t.tasa.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatearFecha(t.vigenteDesde)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.vigenteHasta
                          ? formatearFecha(t.vigenteHasta)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {t.activa ? (
                          <Badge className="bg-green-600">Activa</Badge>
                        ) : (
                          <Badge variant="outline">Histórica</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {t.notas ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}