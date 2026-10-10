import type { Id, GeoPoint, UserSummary, Vehicule } from '@/api/types'
import type { TrajetStatus } from '@/config/enums'
import type { ReservationListItem } from '@/features/bookings/types'

// Contrat de l'API (backend : apps/trajets/api/admin_views.py), réservé aux admins :
//   GET /admin/trajets/?statut=&recherche=&date=AAAA-MM-JJ&page=  → Paginated<TrajetListItem>
//       tri : depart_le décroissant ; recherche sur le conducteur (nom, prénom, téléphone) et les
//       lieux (départ, arrivée, points) ; date = jour de départ en heure de Lomé
//   GET /admin/trajets/{id}/                                      → TrajetDetail (réservations incluses)

export type TrajetListItem = {
  id: Id
  conducteur: UserSummary
  depart: GeoPoint
  arrivee: GeoPoint
  depart_le: string
  places_total: number
  places_restantes: number
  /** Distance par la route (km), calculée par le backend ; null si le routage a échoué */
  distance_km: number | null
  /** Prix par place affiché au conducteur (FCFA), calculé par le backend selon la grille */
  prix_place: number
  statut: TrajetStatus
}

export type PointPriseEnCharge = GeoPoint & {
  id: Id
  ordre: number
}

export type TrajetDetail = TrajetListItem & {
  vehicule: Vehicule
  points: PointPriseEnCharge[]
  reservations: ReservationListItem[]
}

export type TrajetListFilters = {
  statut: string
  recherche: string
  date: string
  page: number
}
