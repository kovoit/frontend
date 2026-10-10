import type { Id, UserSummary, Vehicule } from '@/api/types'
import type { CompteStatus, KycStatus, KycType } from '@/config/enums'

// Contrat de l'API (backend : apps/accounts/api/admin_views.py), réservé aux admins :
//   GET  /admin/utilisateurs/?recherche=&statut=actif|suspendu&page=  → Paginated<UserListItem>
//        tri : cree_le décroissant ; recherche sur nom, prénom, email, téléphone
//   GET  /admin/utilisateurs/{id}/                → UserDetail
//   POST /admin/utilisateurs/{id}/suspendre/ { motif (10 à 500 car.), jours: number | null }
//        → { utilisateur: UserDetail, reservations_annulees } · 409 DEJA_SUSPENDU
//        Effet PRD : engagements à venir annulés et remboursés, réservation et publication bloquées.
//   POST /admin/utilisateurs/{id}/reactiver/      → UserDetail · 409 DEJA_ACTIF

export type KycStatuts = { passager: KycStatus; conducteur: KycStatus }

export type UserListItem = UserSummary & {
  statut_compte: CompteStatus
  kyc: KycStatuts
  /** Fiabilité sur la période (0 à 100), calculée par l'API ; null si aucune réservation */
  fiabilite_pct: number | null
  cree_le: string
}

export type UserDetail = UserSummary & {
  statut_compte: CompteStatus
  kyc: KycStatuts
  cree_le: string
  email_verifie: boolean
  mode_actif: 'passager' | 'conducteur'
  is_staff: boolean
  last_login: string | null
  suspendu_jusqu_au: string | null
  /** Chaîne vide si aucun motif */
  motif_suspension: string
  /** Compteurs sur `periode_j` jours glissants (paramètre periode_incidents_j) */
  fiabilite: {
    pct: number | null
    periode_j: number
    reservations: number
    annulations_tardives: number
    absences: number
  }
  note_moyenne: number | null
  nombre_notes: number
  vehicule: Vehicule | null
  /** Dossiers déjà soumis au moins une fois */
  dossiers_kyc: Array<{
    id: Id
    type: KycType
    statut: KycStatus
    soumis_le: string | null
    traite_le: string | null
    /** Chaîne vide si aucun rejet */
    motif_rejet: string
  }>
  /** 5 dernières notes reçues */
  notes_recues: Array<{
    id: Id
    note: number
    /** Chaîne vide si aucun commentaire */
    commentaire: string
    auteur: { prenom: string; nom: string }
    cree_le: string
  }>
}

export type SuspendPayload = {
  motif: string
  /** null = jusqu'à réactivation manuelle */
  jours: number | null
}

export type SuspendResponse = {
  utilisateur: UserDetail
  reservations_annulees: number
}

export type UserListFilters = {
  recherche: string
  statut: string
  page: number
}
