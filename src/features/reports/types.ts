import type { UserSummary } from '@/api/types'
import type { SignalementStatus } from '@/config/enums'
import type { ReservationListItem } from '@/features/bookings/types'

// Contrat attendu de l'API (à implémenter côté backend DRF), réservé au rôle admin :
//   GET  /admin/signalements/?statut=ouvert|traite&page=     → Paginated<SignalementListItem>
//        tri : cree_le croissant (les plus anciens d'abord)
//   GET  /admin/signalements/{id}/                           → SignalementDetail
//   POST /admin/signalements/{id}/traiter/ { resolution }    → SignalementDetail
//        409 si déjà traité ; 400 si la réservation est en litige (il faut trancher)
//   POST /admin/signalements/{id}/trancher/ { decision, resolution } → SignalementDetail
//        Réservation en litige uniquement → passe à « cloturee ». Avec le portefeuille, le backend
//        crédite le conducteur (decision = conducteur) ou rembourse le passager (decision = passager).

export type DecisionLitige = 'conducteur' | 'passager'

export type SignalementListItem = {
  id: number
  reservation: Pick<ReservationListItem, 'id' | 'statut' | 'trajet_id'>
  auteur: UserSummary
  cible: UserSummary
  motif: string
  statut: SignalementStatus
  cree_le: string
}

export type SignalementDetail = Omit<SignalementListItem, 'reservation'> & {
  reservation: ReservationListItem
  resolution: string | null
  decision: DecisionLitige | null
  traite_le: string | null
  traite_par: { id: number; nom: string; prenom: string } | null
}

export type SignalementListFilters = {
  statut: string
  page: number
}
