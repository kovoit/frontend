import { Link, useParams } from 'react-router'
import { toApiError } from '@/api/client'
import { NotFoundPage } from '@/app/NotFoundPage'
import { RouteStops } from '@/components/map/RouteStops'
import { BackLink } from '@/components/ui/BackLink'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  bookingActionColumn,
  bookingIdColumn,
  bookingPassengerColumn,
  bookingPriceColumn,
  bookingRouteColumn,
  bookingStatusColumn,
} from '@/features/bookings/components/bookingColumns'
import { formatDateTime, formatFcfa, formatKm } from '@/utils/format'
import { useTrip } from '../api'

const RESERVATION_COLUMNS = [
  bookingIdColumn,
  bookingPassengerColumn,
  bookingRouteColumn,
  bookingPriceColumn,
  bookingStatusColumn,
  bookingActionColumn,
]

export function TripDetailPage() {
  const id = Number(useParams().id)
  const { data: trajet, isPending, isError, error, refetch } = useTrip(id)

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Chargement du trajet">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-72" />
        <Skeleton className="h-60" />
      </div>
    )
  }
  if (isError) {
    if (toApiError(error).status === 404) return <NotFoundPage />
    return <QueryError error={error} onRetry={() => void refetch()} />
  }

  const stops = [
    { key: 'depart', label: trajet.depart.libelle, lat: trajet.depart.lat, lng: trajet.depart.lng, kind: 'depart' as const },
    ...[...trajet.points]
      .sort((a, b) => a.ordre - b.ordre)
      .map((point) => ({ key: `p${point.id}`, label: point.libelle, lat: point.lat, lng: point.lng, kind: 'point' as const })),
    { key: 'arrivee', label: trajet.arrivee.libelle, lat: trajet.arrivee.lat, lng: trajet.arrivee.lng, kind: 'arrivee' as const },
  ]

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/admin/trips" label="Retour aux trajets" />

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">
          {trajet.depart.libelle} → {trajet.arrivee.libelle}
        </h2>
        <StatusBadge domain="trajet" value={trajet.statut} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="gap-4 p-5 xl:col-span-2">
          <h2 className="text-lg font-bold">Itinéraire</h2>
          <RouteStops stops={stops} />
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="text-lg font-bold">Informations</h2>
          <DescriptionList
            items={[
              { label: 'Départ', value: formatDateTime(trajet.depart_le) },
              {
                label: 'Conducteur',
                value: (
                  <Link to={`/admin/users/${trajet.conducteur.id}`} className="hover:underline">
                    {trajet.conducteur.prenom} {trajet.conducteur.nom}
                  </Link>
                ),
              },
              { label: 'Véhicule', value: `${trajet.vehicule.marque} ${trajet.vehicule.modele} · ${trajet.vehicule.couleur}` },
              { label: 'Immatriculation', value: trajet.vehicule.immatriculation },
              { label: 'Places libres', value: `${trajet.places_restantes} / ${trajet.places_total}` },
              { label: 'Distance (route)', value: formatKm(trajet.distance_km) },
              { label: 'Prix par place', value: formatFcfa(trajet.prix_place) },
            ]}
          />
        </Card>
      </div>

      <section aria-labelledby="trip-bookings" className="flex flex-col gap-3">
        <h2 id="trip-bookings" className="text-lg font-bold">
          Réservations ({trajet.reservations.length})
        </h2>
        <DataTable
          caption="Réservations du trajet"
          columns={RESERVATION_COLUMNS}
          data={trajet.reservations}
          getRowId={(res) => String(res.id)}
          emptyMessage="Aucune réservation sur ce trajet."
        />
      </section>
    </div>
  )
}
