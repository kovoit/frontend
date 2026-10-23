import type { Id, UserSummary } from '@/api/types'
import type { MoyenPaiement, TransactionStatut, TransactionType } from '@/config/enums'

// Contrat de l'API (backend : apps/portefeuille/api/admin_views.py), réservé aux admins :
//   GET  /admin/transactions/?type=&statut=&moyen=&recherche=&du=&au=&page=
//        → Paginated<TransactionAdmin> · retraits en attente : les plus anciens d'abord
//   POST /admin/transactions/{id}/verser/  { reference (3 à 64 car.) }  → TransactionAdmin
//   POST /admin/transactions/{id}/refuser/ { motif (3 à 255 car.) }     → TransactionAdmin
//        409 RETRAIT_NON_EN_ATTENTE si le retrait a déjà été traité.
//   Le refus rend le montant disponible sur le portefeuille du conducteur.

export type TransactionAdmin = {
  id: Id
  cree_le: string
  type: TransactionType
  statut: TransactionStatut
  montant: number
  /** Vide pour les mouvements internes (blocage, débit, crédit…) */
  moyen_paiement: MoyenPaiement | ''
  telephone: string
  /** Référence PayGate, ou du transfert saisi par l'admin pour un retrait versé */
  reference_externe: string
  /** Référence Flooz / Mixx (réclamations) */
  reference_operateur: string
  reservation_id: Id | null
  utilisateur: UserSummary
}

export type TransactionFilters = {
  type: string
  statut: string
  moyen: string
  recherche: string
  page: number
}
