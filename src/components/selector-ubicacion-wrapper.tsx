'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const SelectorUbicacion = dynamic(
  () =>
    import('./selector-ubicacion').then((mod) => mod.SelectorUbicacion),
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
  latitud: number | null
  longitud: number | null
  onChange: (lat: number | null, lng: number | null) => void
  centroInicial?: [number, number]
  altura?: string
  placeholder?: string
}

export function SelectorUbicacionWrapper(props: Props) {
  return <SelectorUbicacion {...props} />
}