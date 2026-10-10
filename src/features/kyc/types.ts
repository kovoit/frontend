import type { Id, UserSummary, Vehicule } from '@/api/types'
import type { KycStatus, KycType, PieceType } from '@/config/enums'

// Contrat de l'API (backend : apps/kyc/api/admin_views.py), réservé aux admins :
//   GET  /admin/kyc/?statut=&type=&recherche=&page=  → Paginated<KycDossierDetail>
//        tri : soumis_le croissant (les plus anciens d'abord) ; recherche sur nom, prénom, email, téléphone
//   GET  /admin/kyc/{id}/                             → KycDossierDetail
//   GET  /admin/kyc/pieces/{piece_id}/fichier/        → le fichier lui-même (image ou PDF)
//        Cache-Control: no-store ; CHAQUE appel est journalisé (KycConsultation)
//   POST /admin/kyc/{id}/valider/                     → KycDossierDetail (409 DOSSIER_NON_EN_ATTENTE)
//   POST /admin/kyc/{id}/rejeter/ { motif }           → KycDossierDetail (motif : 10 à 500 car.)

export type KycDossierListItem = {
  id: Id
  type: KycType
  statut: KycStatus
  soumis_le: string | null
  traite_le: string | null
  utilisateur: UserSummary
}

export type KycPiece = {
  id: Id
  type_piece: PieceType
  cree_le: string
}

export type KycDossierDetail = KycDossierListItem & {
  /** Chaîne vide si aucun rejet */
  motif_rejet: string
  traite_par: { id: Id; nom: string; prenom: string } | null
  pieces: KycPiece[]
  pieces_manquantes: string[]
  /** Véhicule déclaré (dossier conducteur uniquement) */
  vehicule: Vehicule | null
}

export type KycListFilters = {
  statut: string
  type: string
  recherche: string
  page: number
}
