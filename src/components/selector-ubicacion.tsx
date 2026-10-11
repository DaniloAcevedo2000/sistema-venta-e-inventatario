'use client'

import * as React from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin, Loader2, X, Check } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Fix de iconos
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const iconoSeleccion = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #10b981; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 18px;">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

// ============================================
// TIPOS
// ============================================
type Props = {
  latitud: number | null
  longitud: number | null
  onChange: (lat: number | null, lng: number | null) => void
  centroInicial?: [number, number]
  altura?: string
  placeholder?: string
}

type ResultadoBusqueda = {
  display_name: string
  lat: string
  lon: string
}

// ============================================
// COMPONENTE: CAPTURAR CLICK EN MAPA
// ============================================
function ClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ============================================
// COMPONENTE: RECENTRAR MAPA
// ============================================
function RecentrarMapa({ centro }: { centro: [number, number] }) {
  const map = useMap()
  React.useEffect(() => {
    map.setView(centro, map.getZoom())
  }, [centro, map])
  return null
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function SelectorUbicacion({
  latitud,
  longitud,
  onChange,
  centroInicial = [12.1364, -86.2514], // Managua por defecto
  altura = '400px',
  placeholder = 'Buscar dirección...',
}: Props) {
  const [busqueda, setBusqueda] = React.useState('')
  const [resultados, setResultados] = React.useState<ResultadoBusqueda[]>([])
  const [buscando, setBuscando] = React.useState(false)
  const [mostrarResultados, setMostrarResultados] = React.useState(false)
  const [mostrarManuales, setMostrarManuales] = React.useState(false)

  // Latitud y longitud manuales (inputs)
  const [latManual, setLatManual] = React.useState(latitud?.toString() ?? '')
  const [lngManual, setLngManual] = React.useState(longitud?.toString() ?? '')

  // Actualizar inputs manuales cuando cambian desde afuera
  React.useEffect(() => {
    setLatManual(latitud?.toString() ?? '')
    setLngManual(longitud?.toString() ?? '')
  }, [latitud, longitud])

  // Centro del mapa
  const centro: [number, number] =
    latitud !== null && longitud !== null ? [latitud, longitud] : centroInicial

  // ============================================
  // BUSCAR DIRECCIONES (Nominatim)
  // ============================================
  const buscarDireccion = async () => {
    if (!busqueda.trim() || busqueda.trim().length < 3) return

    setBuscando(true)
    setMostrarResultados(true)

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('q', busqueda)
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '5')
      url.searchParams.set('addressdetails', '1')

      const response = await fetch(url.toString(), {
        headers: {
          // Nominatim requiere User-Agent según su política
          'User-Agent': 'MomotoCafe/1.0',
        },
      })

      if (!response.ok) throw new Error('Error en la búsqueda')

      const data: ResultadoBusqueda[] = await response.json()
      setResultados(data)
    } catch (error) {
      console.error('Error buscando dirección:', error)
      setResultados([])
    } finally {
      setBuscando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      buscarDireccion()
    }
  }

  // ============================================
  // SELECCIONAR RESULTADO
  // ============================================
  const seleccionarResultado = (r: ResultadoBusqueda) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    onChange(lat, lng)
    setMostrarResultados(false)
    setBusqueda('')
  }

  // ============================================
  // CLICK EN MAPA
  // ============================================
  const handleMapClick = (lat: number, lng: number) => {
    onChange(lat, lng)
  }

  // ============================================
  // APLICAR COORDENADAS MANUALES
  // ============================================
  const aplicarManual = () => {
    const lat = parseFloat(latManual)
    const lng = parseFloat(lngManual)
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      onChange(lat, lng)
      setMostrarManuales(false)
    }
  }

  const limpiar = () => {
    onChange(null, null)
    setBusqueda('')
    setResultados([])
    setLatManual('')
    setLngManual('')
  }

  const tieneCoordenadas = latitud !== null && longitud !== null

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-3">
      {/* Buscador */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            onClick={buscarDireccion}
            disabled={buscando || busqueda.trim().length < 3}
          >
            {buscando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </>
            )}
          </Button>
        </div>

        {/* Resultados */}
        {mostrarResultados && (
          <div className="rounded-md border bg-background shadow-md max-h-[250px] overflow-y-auto">
            {buscando ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Buscando...
              </div>
            ) : resultados.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            ) : (
              <div className="divide-y">
                {resultados.map((r, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => seleccionarResultado(r)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-2"
                  >
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{r.display_name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {parseFloat(r.lat).toFixed(6)},{' '}
                        {parseFloat(r.lon).toFixed(6)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div
        style={{ height: altura }}
        className="rounded-lg overflow-hidden border relative"
      >
        <MapContainer
          center={centro}
          zoom={tieneCoordenadas ? 16 : 13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler onSelect={handleMapClick} />

          {tieneCoordenadas && (
            <>
              <Marker
                position={[latitud, longitud]}
                icon={iconoSeleccion}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target
                    const pos = marker.getLatLng()
                    onChange(pos.lat, pos.lng)
                  },
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">Ubicación de entrega</p>
                    <p className="text-muted-foreground mt-1">
                      Arrastra el pin para ajustar
                    </p>
                  </div>
                </Popup>
              </Marker>
              <RecentrarMapa centro={[latitud, longitud]} />
            </>
          )}
        </MapContainer>

        {/* Instrucción flotante */}
        {!tieneCoordenadas && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur rounded-lg shadow-lg px-4 py-2 text-xs border z-[1000] pointer-events-none">
            👆 Haz click en el mapa para marcar la ubicación
          </div>
        )}
      </div>

      {/* Estado y acciones */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {tieneCoordenadas ? (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="gap-1 bg-green-600">
              <Check className="h-3 w-3" />
              Ubicación seleccionada
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {latitud.toFixed(6)}, {longitud.toFixed(6)}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limpiar}
              className="text-destructive h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Busca una dirección o haz click en el mapa
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMostrarManuales(!mostrarManuales)}
          className="h-7 text-xs"
        >
          <MapPin className="h-3 w-3 mr-1" />
          {mostrarManuales ? 'Ocultar' : 'Ingresar'} coordenadas manualmente
        </Button>
      </div>

      {/* Campos manuales */}
      {mostrarManuales && (
        <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-xs">
              Coordenadas manuales (latitud, longitud)
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="lat-input" className="text-xs">
                Latitud
              </Label>
              <Input
                id="lat-input"
                type="number"
                step="0.000001"
                value={latManual}
                onChange={(e) => setLatManual(e.target.value)}
                placeholder="12.1364"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lng-input" className="text-xs">
                Longitud
              </Label>
              <Input
                id="lng-input"
                type="number"
                step="0.000001"
                value={lngManual}
                onChange={(e) => setLngManual(e.target.value)}
                placeholder="-86.2514"
                className="h-9"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={aplicarManual}
            disabled={!latManual || !lngManual}
            className="w-full"
          >
            Aplicar coordenadas
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            También puedes pegar coordenadas de Google Maps con el formato:
            <br />
            <span className="font-mono">12.1364, -86.2514</span>
          </p>
        </div>
      )}
    </div>
  )
}