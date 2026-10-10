'use client'

import * as React from 'react'
import {
  Building2,
  CreditCard,
  DollarSign,
  Wallet,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TasaCambioCard } from '../tasa-cambio-card'
import { BancosTab } from '../bancos-tab'
import { MetodosTab } from '../metodos-tab'
import { RedesTab } from '../redes-tab'

type Banco = {
  id: string
  codigo: string
  nombre: string
  nombreCorto: string | null
  permiteTarjeta: boolean
  permiteTransferencia: boolean
  orden: number
  activo: boolean
}

type MetodoPago = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: string
  requiereBanco: boolean
  requiereRed: boolean
  requiereReferencia: boolean
  esCredito: boolean
  icono: string | null
  orden: number
  activo: boolean
}

type RedTarjeta = {
  id: string
  codigo: string
  nombre: string
  orden: number
  activo: boolean
}

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
  bancos: Banco[]
  metodosPago: MetodoPago[]
  redesTarjeta: RedTarjeta[]
  tasaActual: Tasa | null
  historialTasas: HistorialTasa[]
}

export function PagosTabs({
  bancos,
  metodosPago,
  redesTarjeta,
  tasaActual,
  historialTasas,
}: Props) {
  const bancosActivos = bancos.filter((b) => b.activo).length
  const metodosActivos = metodosPago.filter((m) => m.activo).length
  const redesActivas = redesTarjeta.filter((r) => r.activo).length

  return (
    <div className="space-y-6">
      {/* Tasa de cambio destacada */}
      <TasaCambioCard
        tasaActual={tasaActual}
        historialTasas={historialTasas}
      />

      {/* Tabs */}
      <Tabs defaultValue="bancos">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="bancos" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bancos
            <Badge variant="secondary" className="ml-1 h-5">
              {bancosActivos}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="metodos" className="gap-2">
            <Wallet className="h-4 w-4" />
            Métodos de pago
            <Badge variant="secondary" className="ml-1 h-5">
              {metodosActivos}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="redes" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Redes de tarjeta
            <Badge variant="secondary" className="ml-1 h-5">
              {redesActivas}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bancos" className="mt-6">
          <BancosTab bancos={bancos} />
        </TabsContent>

        <TabsContent value="metodos" className="mt-6">
          <MetodosTab metodosPago={metodosPago} />
        </TabsContent>

        <TabsContent value="redes" className="mt-6">
          <RedesTab redesTarjeta={redesTarjeta} />
        </TabsContent>
      </Tabs>
    </div>
  )
}