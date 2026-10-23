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
  /** Durée estimée (min) ; null pour un trajet publié avant la tarification automatique */
  duree_min: number | null
  /** Prix d'une place (FCFA), calculé et figé par le backend à la publication */
  prix_place: number
  statut: TrajetStatus
}

/**
 * Calcul du prix figé à la publication (backend : apps/tarification/calcul.py, TarificationSerializer).
 * Postes de coût : chaînes décimales (ex. « 571.900 ») ; prix et montants payés : entiers FCFA.
 * Totaux (`total_paye_passagers`, `commission_kovoit`, `net_conducteur`) : si toutes les places
 * proposées sont prises. Le front n'en recalcule aucun.
 */
export type Tarification = {
  formule_version: string
  type_vehicule: 'voiture' | 'moto'
  distance_km: string
  duree_min: number
  source_itineraire: 'routage' | 'estimation'
  passagers_prevus: number
  consommation_retenue_l_100km: string
  carburant_litres: string
  cout_carburant: string
  cout_temps: string
  cout_entretien: string
  cout_total: string
  part_conducteur: string
  contribution_passagers: string
  montant_brut_passagers: string
  prix_place: number
  commission_place: number
  net_conducteur_place: number
  total_paye_passagers: number
  commission_kovoit: number
  net_conducteur: number
  parametres: {
    prix_carburant_litre: string
    consommation_l_100km: string
    source_consommation: string
    majoration_charge_par_passager_pct: string
    cout_horaire_conducteur: string
    entretien_par_km: string
    taux_commission_pct: string
    arrondi_prix_fcfa: number
    prix_minimum_place: number
  }
}

export type PointPriseEnCharge = GeoPoint & {
  id: Id
  ordre: number
}

export type TrajetDetail = TrajetListItem & {
  vehicule: Vehicule
  points: PointPriseEnCharge[]
  reservations: ReservationListItem[]
  /** null : trajet publié avant la tarification automatique (prix fixe) */
  tarification: Tarification | null
}

export type TrajetListFilters = {
  statut: string
  recherche: string
  date: string
  page: number
}
