import type { Id, GeoPoint, UserSummary } from '@/api/types'
import type { ReservationStatus, SignalementStatus } from '@/config/enums'

// Contrat de l'API (backend : apps/reservations/api/admin_views.py), réservé aux admins :
//   GET /admin/reservations/?statut=&recherche=&trajet=<uuid>&page=  → Paginated<ReservationListItem>
//       tri : cree_le décroissant ; recherche sur passager et conducteur (nom, prénom, téléphone, email)
//   GET /admin/reservations/{id}/                                    → ReservationDetail
// Le code de départ n'est JAMAIS renvoyé, même à l'admin.

export type ReservationListItem = {
  id: Id
  trajet_id: Id
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
  point: GeoPoint & { id: Id; ordre: number }
  arrivee: GeoPoint
  /** Distance facturée : du point de prise en charge à l'arrivée du passager (km) ; null si inconnue */
  distance_km: number | null
  /** Annulation à moins de delai_annulation_min du départ (compte dans la fiabilité) */
  annulation_tardive: boolean
  /** Statuts atteints, du plus ancien au plus récent (« demandée » = date de création) */
  historique: Array<{ statut: ReservationStatus; le: string }>
  signalements: Array<{ id: Id; motif: string; statut: SignalementStatus; cree_le: string }>
}

export type ReservationListFilters = {
  statut: string
  recherche: string
  page: number
}
