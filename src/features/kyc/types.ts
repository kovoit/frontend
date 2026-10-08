import type { UserSummary, Vehicule } from '@/api/types'
import type { KycStatus, KycType, PieceType } from '@/config/enums'

// Contrat attendu de l'API (à implémenter côté backend DRF), réservé au rôle admin :
//   GET  /admin/kyc/?statut=&type=&search=&page=   → Paginated<KycDossierListItem>
//        tri : soumis_le croissant (les plus anciens d'abord) ; search sur nom, prénom, email, téléphone
//   GET  /admin/kyc/{id}/                          → KycDossierDetail
//   GET  /admin/kyc/pieces/{piece_id}/url/         → { url, expire_le }
//        URL signée à durée courte ; CHAQUE appel est journalisé (table kyc_consultations)
//   POST /admin/kyc/{id}/valider/                  → KycDossierDetail   (409 si statut ≠ en_attente)
//   POST /admin/kyc/{id}/rejeter/ { motif_rejet }  → KycDossierDetail   (400 si motif vide)

export type KycDossierListItem = {
  id: number
  type: KycType
  statut: KycStatus
  soumis_le: string | null
  traite_le: string | null
  user: UserSummary
}

export type KycPiece = {
  id: number
  type_piece: PieceType
}

export type KycDossierDetail = KycDossierListItem & {
  motif_rejet: string | null
  traite_par: { id: number; nom: string; prenom: string } | null
  pieces: KycPiece[]
  /** Véhicule déclaré (dossier conducteur uniquement) */
  vehicule: Vehicule | null
}

export type PieceUrl = {
  url: string
  expire_le: string
}

export type KycListFilters = {
  statut: string
  type: string
  search: string
  page: number
}
