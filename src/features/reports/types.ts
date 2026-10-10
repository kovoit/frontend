import type { Id, UserSummary } from '@/api/types'
import type { SignalementStatus } from '@/config/enums'
import type { ReservationListItem } from '@/features/bookings/types'

// Contrat de l'API (backend : apps/confiance/api/admin_views.py), réservé aux admins :
//   GET  /admin/signalements/?statut=ouvert|traite&page=  → Paginated<SignalementListItem>
//        tri : cree_le croissant (les plus anciens d'abord)
//   GET  /admin/signalements/{id}/                        → SignalementDetail
//   POST /admin/signalements/{id}/traiter/ { resolution (10 à 1000 car.), decision? }
//        → SignalementDetail · 409 DEJA_TRAITE
//        Si la réservation est en litige, decision est obligatoire (400 DECISION_REQUISE) :
//        la réservation passe à « cloturee » et le backend paie le conducteur
//        (crediter_conducteur) ou rembourse le passager (rembourser_passager).

export type DecisionLitige = 'crediter_conducteur' | 'rembourser_passager'

export type SignalementListItem = {
  id: Id
  reservation: Pick<ReservationListItem, 'id' | 'statut' | 'trajet_id'>
  auteur: UserSummary
  cible: UserSummary
  motif: string
  statut: SignalementStatus
  cree_le: string
}

export type SignalementDetail = Omit<SignalementListItem, 'reservation'> & {
  reservation: ReservationListItem
  /** Chaîne vide tant que le signalement n'est pas traité */
  resolution: string
  /** Chaîne vide si aucune décision (signalement simple ou non traité) */
  decision: DecisionLitige | ''
  traite_le: string | null
  traite_par: { id: Id; nom: string; prenom: string } | null
}

export type SignalementListFilters = {
  statut: string
  page: number
}
