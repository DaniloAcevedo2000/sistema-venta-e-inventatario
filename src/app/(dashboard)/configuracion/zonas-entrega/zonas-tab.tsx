'use client'

import * as React from 'react'
import { Plus, MapPin, Edit, Power, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ZonaFormDialog } from './zona-form-dialog'
import { toggleZonaAction } from './actions'

type Zona = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tarifa: number
  tiempoEstimadoMin: number | null
  color: string | null
  orden: number
  activa: boolean
  cantidadPedidos: number
}

function formatearMoneda(valor: number) {
  return `C$ ${valor.toFixed(2)}`
}

export function ZonasTab({ zonas }: { zonas: Zona[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [zonaEditar, setZonaEditar] = React.useState<Zona | null>(null)

  const handleToggle = async (zona: Zona) => {
    const result = await toggleZonaAction(zona.id)
    if (result.success) {
      toast.success(zona.activa ? 'Zona desactivada' : 'Zona activada')
      window.location.reload()
    } else {
      toast.error(result.error || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Zonas configuradas</h2>
          <p className="text-sm text-muted-foreground">
            {zonas.filter((z) => z.activa).length} activas de {zonas.length}
          </p>
        </div>
        <Button
          onClick={() => {
            setZonaEditar(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva zona
        </Button>
      </div>

      {zonas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground mb-4">
              No hay zonas de entrega configuradas
            </p>
            <Button
              onClick={() => {
                setZonaEditar(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear primera zona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zonas.map((zona, index) => (
            <motion.div
              key={zona.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`relative ${
                  zona.activa
                    ? 'border-primary/30'
                    : 'border-muted opacity-60'
                }`}
              >
                <div
                  className="h-2 rounded-t-lg"
                  style={{ backgroundColor: zona.color || '#6B4226' }}
                />
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-lg p-2"
                        style={{
                          backgroundColor: `${zona.color || '#6B4226'}20`,
                        }}
                      >
                        <MapPin
                          className="h-5 w-5"
                          style={{ color: zona.color || '#6B4226' }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{zona.nombre}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {zona.codigo}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={zona.activa ? 'default' : 'secondary'}
                      className={zona.activa ? 'bg-green-600' : ''}
                    >
                      {zona.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>

                  {zona.descripcion && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {zona.descripcion}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tarifa</span>
                      <span className="font-bold text-primary text-lg">
                        {formatearMoneda(zona.tarifa)}
                      </span>
                    </div>

                    {zona.tiempoEstimadoMin && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Tiempo
                        </span>
                        <span className="text-sm font-medium">
                          ~{zona.tiempoEstimadoMin} min
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pedidos</span>
                      <Badge variant="secondary" className="text-xs">
                        {zona.cantidadPedidos}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setZonaEditar(zona)
                        setDialogOpen(true)
                      }}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        zona.activa ? 'text-destructive' : 'text-green-600'
                      }
                      onClick={() => handleToggle(zona)}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ZonaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        zona={zonaEditar}
      />
    </div>
  )
}