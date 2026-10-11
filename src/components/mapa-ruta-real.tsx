'use client'

import * as React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const iconoNegocio = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #6B4226; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 18px;">☕</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const iconoCliente = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #10b981; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 18px;">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

function AjustarVista({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  React.useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, coords])
  return null
}

type Props = {
  latitudOrigen: number
  longitudOrigen: number
  latitudDestino: number
  longitudDestino: number
  nombreOrigen?: string
  nombreDestino?: string
  altura?: string
}

export function MapaRutaReal({
  latitudOrigen,
  longitudOrigen,
  latitudDestino,
  longitudDestino,
  nombreOrigen = 'Origen',
  nombreDestino = 'Destino',
  altura = '400px',
}: Props) {
  const [ruta, setRuta] = React.useState<[number, number][]>([])
  const [cargando, setCargando] = React.useState(true)
  const [distancia, setDistancia] = React.useState<number | null>(null)
  const [duracion, setDuracion] = React.useState<number | null>(null)

  const origen: [number, number] = [latitudOrigen, longitudOrigen]
  const destino: [number, number] = [latitudDestino, longitudDestino]

  // Cargar ruta desde OSRM (servicio público gratis)
  React.useEffect(() => {
    const cargarRuta = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${longitudOrigen},${latitudOrigen};${longitudDestino},${latitudDestino}?overview=full&geometries=geojson`

        const response = await fetch(url)
        const data = await response.json()

        if (data.routes && data.routes[0]) {
          const route = data.routes[0]
          const coordinates = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          )
          setRuta(coordinates)
          setDistancia(route.distance / 1000) // km
          setDuracion(Math.ceil(route.duration / 60)) // minutos
        }
      } catch (error) {
        console.error('Error cargando ruta:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarRuta()
  }, [latitudOrigen, longitudOrigen, latitudDestino, longitudDestino])

  return (
    <div className="space-y-2">
      <div
        style={{ height: altura, width: '100%' }}
        className="rounded-lg overflow-hidden border"
      >
        <MapContainer
          center={origen}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={origen} icon={iconoNegocio}>
            <Popup>
              <strong>{nombreOrigen}</strong>
              <br />
              Punto de partida
            </Popup>
          </Marker>

          <Marker position={destino} icon={iconoCliente}>
            <Popup>
              <strong>{nombreDestino}</strong>
              <br />
              Punto de entrega
            </Popup>
          </Marker>

          {/* Línea recta como fallback mientras carga */}
          {cargando && (
            <Polyline
              positions={[origen, destino]}
              pathOptions={{ color: '#6B4226', weight: 3, dashArray: '10, 10' }}
            />
          )}

          {/* Ruta real por carretera */}
          {ruta.length > 0 && (
            <Polyline
              positions={ruta}
              pathOptions={{
                color: '#6B4226',
                weight: 5,
                opacity: 0.8,
              }}
            />
          )}

          <AjustarVista coords={ruta.length > 0 ? ruta : [origen, destino]} />
        </MapContainer>
      </div>

      {/* Info de la ruta */}
      {(distancia !== null || duracion !== null) && (
        <div className="flex items-center gap-4 text-sm bg-muted/50 rounded-lg p-3">
          {distancia !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Distancia</p>
              <p className="font-semibold">{distancia.toFixed(2)} km</p>
            </div>
          )}
          {duracion !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Tiempo estimado</p>
              <p className="font-semibold">~{duracion} min</p>
            </div>
          )}
        </div>
      )}

      {cargando && (
        <p className="text-xs text-muted-foreground text-center">
          Calculando ruta óptima...
        </p>
      )}
    </div>
  )
}