import type { GeoPoint, UserSummary } from '@/api/types'
import type { ReservationStatus, SignalementStatus } from '@/config/enums'

// Contrat attendu de l'API (à implémenter côté backend DRF), réservé au rôle admin :
//   GET /admin/reservations/?statut=&search=&trajet=&page=   → Paginated<ReservationListItem>
//       tri : cree_le décroissant ; search sur passager et conducteur (nom, téléphone)
//   GET /admin/reservations/{id}/                            → ReservationDetail
// Le code de départ (code_depart_hash) n'est JAMAIS renvoyé, même à l'admin.

export type ReservationListItem = {
  id: number
  trajet_id: number
  passager: UserSummary
  conducteur: UserSummary
  /** Libellé du point de prise en charge choisi */
  point_libelle: string
  arrivee_libelle: string
  /** Heure de départ du trajet */
  depart_le: string
  /** Prix payé par le passager (FCFA), calculé par le backend */
  prix: number
  frais_service: number
  statut: ReservationStatus
  cree_le: string
}

export type ReservationDetail = ReservationListItem & {
  point: GeoPoint & { ordre: number }
  arrivee: GeoPoint
  /** Distance facturée : du point de prise en charge à l'arrivée du passager (km) */
  distance_km: number
  /** Horodatage de chaque changement de statut, du plus ancien au plus récent */
  historique: Array<{ statut: ReservationStatus; le: string }>
  signalements: Array<{ id: number; motif: string; statut: SignalementStatus; cree_le: string }>
}

export type ReservationListFilters = {
  statut: string
  search: string
  page: number
}
