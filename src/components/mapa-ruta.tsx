'use client'

import * as React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ============================================
// FIX: iconos de Leaflet con Next.js
// ============================================
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ============================================
// ICONOS PERSONALIZADOS
// ============================================
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

// ============================================
// COMPONENTE PARA AJUSTAR ZOOM AUTOMÁTICO
// ============================================
function AjustarVista({
  origen,
  destino,
}: {
  origen: [number, number]
  destino: [number, number]
}) {
  const map = useMap()

  React.useEffect(() => {
    const bounds = L.latLngBounds([origen, destino])
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, origen, destino])

  return null
}

// ============================================
// PROPS
// ============================================
type Props = {
  latitudOrigen: number
  longitudOrigen: number
  latitudDestino: number
  longitudDestino: number
  nombreOrigen?: string
  nombreDestino?: string
  altura?: string
  mostrarRuta?: boolean
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function MapaRuta({
  latitudOrigen,
  longitudOrigen,
  latitudDestino,
  longitudDestino,
  nombreOrigen = 'Origen',
  nombreDestino = 'Destino',
  altura = '400px',
  mostrarRuta = true,
}: Props) {
  const origen: [number, number] = [latitudOrigen, longitudOrigen]
  const destino: [number, number] = [latitudDestino, longitudDestino]

  return (
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

        {mostrarRuta && (
          <Polyline
            positions={[origen, destino]}
            pathOptions={{
              color: '#6B4226',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}

        <AjustarVista origen={origen} destino={destino} />
      </MapContainer>
    </div>
  )
}