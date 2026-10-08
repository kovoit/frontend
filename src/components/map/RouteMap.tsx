import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import { colors } from '@/theme/tokens'

export type MapStop = {
  key: string
  label: string
  lat: number
  lng: number
  kind: 'depart' | 'point' | 'arrivee'
}

const STYLE: Record<MapStop['kind'], { color: string; radius: number }> = {
  depart: { color: colors.chart[1], radius: 9 },
  point: { color: colors.chart[2], radius: 7 },
  arrivee: { color: colors.brand[900], radius: 9 },
}

/**
 * Carte de l'itinéraire (Leaflet + OpenStreetMap). Le tracé relie les arrêts dans l'ordre ;
 * ce n'est pas l'itinéraire routier exact. Chargée à la demande (export par défaut pour React.lazy).
 */
export default function RouteMap({ stops }: { stops: MapStop[] }) {
  const positions = stops.map((stop) => [stop.lat, stop.lng] as [number, number])

  return (
    <MapContainer
      bounds={positions}
      boundsOptions={{ padding: [32, 32] }}
      scrollWheelZoom={false}
      className="h-full w-full rounded-2xl"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} pathOptions={{ color: colors.brand[700], weight: 3, dashArray: '6 8' }} />
      {stops.map((stop) => (
        <CircleMarker
          key={stop.key}
          center={[stop.lat, stop.lng]}
          radius={STYLE[stop.kind].radius}
          pathOptions={{
            color: '#FFFFFF',
            weight: 2,
            fillColor: STYLE[stop.kind].color,
            fillOpacity: 1,
          }}
        >
          <Tooltip>{stop.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
