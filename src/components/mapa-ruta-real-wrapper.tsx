'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Carga dinámica SIN SSR
const MapaRutaReal = dynamic(
  () => import('./mapa-ruta-real').then((mod) => mod.MapaRutaReal),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg border">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    ),
  }
)

type Props = {
  latitudOrigen: number
  longitudOrigen: number
  latitudDestino: number
  longitudDestino: number
  nombreOrigen?: string
  nombreDestino?: string
  altura?: string
}

export function MapaRutaRealWrapper(props: Props) {
  return <MapaRutaReal {...props} />
}