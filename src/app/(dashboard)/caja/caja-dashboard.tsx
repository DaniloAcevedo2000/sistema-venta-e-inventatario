'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Lock,
  Unlock,
  Plus,
  Eye,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AbrirCajaDialog } from './abrir-caja-dialog'
import { CerrarCajaDialog } from './cerrar-caja-dialog'
import { SesionDetalleDialog } from './sesion-detalle-dialog'

type Caja = {
  id: string
  codigo: string
  nombre: string
  sesionAbierta: {
    id: string
    usuarioId: string
    usuarioNombre: string
    fechaApertura: string
    montoInicial: number
    cantidadVentas: number
  } | null
}

type MiSesion = {
  id: string
  cajaNombre: string
  cajaCodigo: string
  fechaApertura: string
  montoInicial: number
}

type SesionReciente = {
  id: string
  cajaNombre: string
  cajaCodigo: string
  usuarioNombre: string
  fechaApertura: string
  fechaCierre: string | null
  montoInicial: number
  montoFinal: number | null
  montoEsperado: number | null
  diferencia: number | null
  totalVentas: number
  cantidadVentas: number
  cantidadMovimientos: number
  estado: string
}

type Props = {
  cajas: Caja[]
  misSesiones: MiSesion[]
  sesionesRecientes: SesionReciente[]
  permisos: string[]
  usuarioActualId: string
  puedeVerTodas: boolean
  stats: {
    totalVentasHoy: number
    efectivoHoy: number
    sesionesAbiertas: number
  }
}

function formatearFecha(fechaISO: string) {
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fechaISO))
}

export function CajaDashboard({
  cajas,
  misSesiones,
  sesionesRecientes,
  permisos,
  usuarioActualId,
  puedeVerTodas,
  stats,
}: Props) {
  const [abrirOpen, setAbrirOpen] = React.useState(false)
  const [cerrarSesion, setCerrarSesion] = React.useState<any>(null)
  const [detalleSesion, setDetalleSesion] = React.useState<string | null>(null)

  const puedeAbrir = permisos.includes('caja:abrir')
  const puedeCerrar = permisos.includes('caja:cerrar')

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ventas Hoy</p>
                  <p className="text-2xl font-bold">C$ {stats.totalVentasHoy.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Efectivo Hoy</p>
                  <p className="text-2xl font-bold">C$ {stats.efectivoHoy.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cajas Abiertas</p>
                  <p className="text-2xl font-bold">{stats.sesionesAbiertas}</p>
                </div>
                <Unlock className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cajas físicas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Cajas de la sucursal</h2>
          {puedeAbrir && (
            <Button onClick={() => setAbrirOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Abrir Caja
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cajas.map((caja) => {
            const esMiSesion = caja.sesionAbierta?.usuarioId === usuarioActualId
            const puedeCerrarEstaCaja = caja.sesionAbierta && (esMiSesion || puedeVerTodas)

            return (
              <Card
                key={caja.id}
                className={
                  caja.sesionAbierta
                    ? esMiSesion
                      ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10'
                      : 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10'
                    : ''
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-2 ${caja.sesionAbierta ? esMiSesion ? 'bg-green-100 dark:bg-green-900/40' : 'bg-amber-100 dark:bg-amber-900/40' : 'bg-muted'}`}>
                        {caja.sesionAbierta ? (
                          <Unlock className={`h-5 w-5 ${esMiSesion ? 'text-green-600' : 'text-amber-600'}`} />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{caja.nombre}</p>
                        <p className="text-xs text-muted-foreground font-mono">{caja.codigo}</p>
                      </div>
                    </div>
                    {caja.sesionAbierta ? (
                      esMiSesion ? <Badge className="bg-green-600">Mi sesión</Badge> : <Badge variant="secondary">Abierta</Badge>
                    ) : (
                      <Badge variant="secondary">Cerrada</Badge>
                    )}
                  </div>

                  {caja.sesionAbierta ? (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cajero</span>
                          <span className="font-medium">{caja.sesionAbierta.usuarioNombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Apertura</span>
                          <span className="text-xs">{formatearFecha(caja.sesionAbierta.fechaApertura)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monto inicial</span>
                          <span className="font-medium">C$ {caja.sesionAbierta.montoInicial.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ventas</span>
                          <Badge variant="secondary">{caja.sesionAbierta.cantidadVentas}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetalleSesion(caja.sesionAbierta!.id)}>
                          <Eye className="mr-2 h-3 w-3" /> Ver
                        </Button>
                        {puedeCerrarEstaCaja && (
                          <Button variant="destructive" size="sm" className="flex-1" onClick={() => setCerrarSesion({ id: caja.sesionAbierta!.id, cajaNombre: caja.nombre })}>
                            <Lock className="mr-2 h-3 w-3" /> Cerrar
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Caja disponible</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sesiones recientes */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {puedeVerTodas ? 'Sesiones Recientes' : 'Mis Sesiones Recientes'}
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caja</TableHead>
                {puedeVerTodas && <TableHead>Cajero</TableHead>}
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead className="text-right">Inicial</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sesionesRecientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={puedeVerTodas ? 10 : 9} className="h-24 text-center text-muted-foreground">
                    No hay sesiones registradas
                  </TableCell>
                </TableRow>
              ) : (
                sesionesRecientes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="font-medium text-sm">{s.cajaNombre}</span>
                    </TableCell>
                    {puedeVerTodas && <TableCell className="text-sm">{s.usuarioNombre}</TableCell>}
                    <TableCell className="text-xs">{formatearFecha(s.fechaApertura)}</TableCell>
                    <TableCell className="text-xs">{s.fechaCierre ? formatearFecha(s.fechaCierre) : '—'}</TableCell>
                    <TableCell className="text-right text-sm">C$ {s.montoInicial.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm">{s.montoFinal !== null ? `C$ ${s.montoFinal.toFixed(2)}` : '—'}</TableCell>
                    <TableCell className="text-right">
                      {s.diferencia !== null ? (
                        <Badge variant={Math.abs(s.diferencia) < 0.01 ? 'default' : s.diferencia > 0 ? 'default' : 'destructive'} className={Math.abs(s.diferencia) < 0.01 ? 'bg-green-600' : s.diferencia > 0 ? 'bg-amber-600' : ''}>
                          {s.diferencia > 0 ? '+' : ''}{s.diferencia.toFixed(2)}
                        </Badge>
                      ) : ('—')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{s.cantidadVentas}</Badge>
                    </TableCell>
                    <TableCell>
                      {/* BADGES CORREGIDOS PARA MOSTRAR EL ESTADO REAL */}
                      {s.estado === 'ABIERTA' && <Badge className="bg-green-600">Abierta</Badge>}
                      {s.estado === 'POR_AUTORIZAR' && <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Por Autorizar</Badge>}
                      {s.estado === 'RECHAZADA' && <Badge variant="destructive">Rechazada</Badge>}
                      {s.estado === 'CERRADA' && <Badge variant="outline">Cerrada</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDetalleSesion(s.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogs */}
      <AbrirCajaDialog
        open={abrirOpen}
        onOpenChange={setAbrirOpen}
        cajas={cajas.filter((c) => !c.sesionAbierta)}
        misSesiones={misSesiones.length}
      />

      {cerrarSesion && (
        <CerrarCajaDialog
          open={!!cerrarSesion}
          onOpenChange={(open) => !open && setCerrarSesion(null)}
          sesionId={cerrarSesion.id}
          cajaNombre={cerrarSesion.cajaNombre}
        />
      )}

      {detalleSesion && (
        <SesionDetalleDialog
          open={!!detalleSesion}
          onOpenChange={(open) => !open && setDetalleSesion(null)}
          sesionId={detalleSesion}
        />
      )}
    </div>
  )
}