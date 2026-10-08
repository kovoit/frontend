import type { UserSummary, Vehicule } from '@/api/types'
import type { CompteStatus, KycStatus, KycType } from '@/config/enums'

// Contrat attendu de l'API (à implémenter côté backend DRF), réservé au rôle admin :
//   GET  /admin/users/?search=&statut_compte=&page=   → Paginated<UserListItem>
//        tri : cree_le décroissant ; search sur nom, prénom, email, téléphone
//   GET  /admin/users/{id}/                           → UserDetail
//   POST /admin/users/{id}/suspendre/ { motif, duree_jours: number | null }
//        → { user: UserDetail, reservations_annulees: number }
//        Effet PRD : réservations à venir annulées et remboursées, réservation et publication bloquées.
//   POST /admin/users/{id}/reactiver/                 → UserDetail

export type UserListItem = UserSummary & {
  statut_compte: CompteStatus
  kyc_passager: KycStatus
  kyc_conducteur: KycStatus
  /** Taux de fiabilité sur 30 jours (0 à 1), calculé par l'API ; null si aucune réservation */
  fiabilite: number | null
  cree_le: string
}

export type UserDetail = UserListItem & {
  telephone_verifie_le: string | null
  mode_actif: 'passager' | 'conducteur'
  suspendu_jusqu_au: string | null
  motif_suspension: string | null
  note_moyenne: number | null
  nb_notes: number
  /** Compteurs sur 30 jours glissants, base du taux de fiabilité */
  fiabilite_detail: {
    reservations_30j: number
    annulations_tardives_30j: number
    absences_30j: number
  }
  vehicule: Vehicule | null
  dossiers_kyc: Array<{
    id: number
    type: KycType
    statut: KycStatus
    soumis_le: string | null
    traite_le: string | null
    motif_rejet: string | null
  }>
  /** 5 dernières notes reçues */
  notes_recues: Array<{
    id: number
    note: number
    commentaire: string | null
    auteur: { prenom: string; nom: string }
    cree_le: string
  }>
}

export type SuspendPayload = {
  motif: string
  /** null = jusqu'à réactivation manuelle */
  duree_jours: number | null
}

export type SuspendResponse = {
  user: UserDetail
  reservations_annulees: number
}

export type UserListFilters = {
  search: string
  statut_compte: string
  page: number
}
