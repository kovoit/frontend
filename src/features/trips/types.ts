import type { GeoPoint, UserSummary, Vehicule } from '@/api/types'
import type { TrajetStatus } from '@/config/enums'
import type { ReservationListItem } from '@/features/bookings/types'

// Contrat attendu de l'API (à implémenter côté backend DRF), réservé au rôle admin :
//   GET /admin/trajets/?statut=&search=&date=AAAA-MM-JJ&page=   → Paginated<TrajetListItem>
//       tri : depart_le décroissant ; search sur le conducteur (nom, téléphone) et les libellés de lieux
//   GET /admin/trajets/{id}/                                    → TrajetDetail

export type TrajetListItem = {
  id: number
  conducteur: UserSummary
  depart: GeoPoint
  arrivee: GeoPoint
  depart_le: string
  places_total: number
  places_restantes: number
  /** Distance par la route (km), calculée par le backend */
  distance_km: number
  /** Prix par place affiché au conducteur (FCFA), calculé par le backend selon la grille */
  prix_place: number
  statut: TrajetStatus
}

export type PointPriseEnCharge = GeoPoint & {
  id: number
  ordre: number
}

export type TrajetDetail = TrajetListItem & {
  vehicule: Vehicule
  points: PointPriseEnCharge[]
  reservations: ReservationListItem[]
}

export type TrajetListFilters = {
  statut: string
  search: string
  date: string
  page: number
}
