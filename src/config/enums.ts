// Valeurs exactes du PRD (modèle de données). Ne pas renommer : ce sont les valeurs de l'API.

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

type StatusMeta = { label: string; tone: Tone }

export const RESERVATION_STATUS = {
  demandee: { label: 'Demandée', tone: 'warning' },
  acceptee: { label: 'Acceptée', tone: 'info' },
  refusee: { label: 'Refusée', tone: 'danger' },
  annulee: { label: 'Annulée', tone: 'neutral' },
  absent: { label: 'Absent', tone: 'danger' },
  en_cours: { label: 'En cours', tone: 'info' },
  terminee: { label: 'Terminée', tone: 'success' },
  litige: { label: 'Litige', tone: 'danger' },
  cloturee: { label: 'Clôturée', tone: 'success' },
} as const satisfies Record<string, StatusMeta>

export const TRAJET_STATUS = {
  publie: { label: 'Publié', tone: 'info' },
  complet: { label: 'Complet', tone: 'warning' },
  en_cours: { label: 'En cours', tone: 'info' },
  termine: { label: 'Terminé', tone: 'success' },
  annule: { label: 'Annulé', tone: 'neutral' },
} as const satisfies Record<string, StatusMeta>

export const KYC_STATUS = {
  non_verifie: { label: 'Non vérifié', tone: 'neutral' },
  en_attente: { label: 'En attente', tone: 'warning' },
  verifie: { label: 'Vérifié', tone: 'success' },
  rejete: { label: 'Rejeté', tone: 'danger' },
} as const satisfies Record<string, StatusMeta>

export const COMPTE_STATUS = {
  actif: { label: 'Actif', tone: 'success' },
  suspendu: { label: 'Suspendu', tone: 'danger' },
} as const satisfies Record<string, StatusMeta>

export const SIGNALEMENT_STATUS = {
  ouvert: { label: 'Ouvert', tone: 'warning' },
  traite: { label: 'Traité', tone: 'success' },
} as const satisfies Record<string, StatusMeta>

// Portefeuille (backend : apps/portefeuille/models.py)
export const TRANSACTION_STATUT = {
  validee: { label: 'Validée', tone: 'success' },
  en_attente: { label: 'En attente', tone: 'warning' },
  echouee: { label: 'Échouée', tone: 'danger' },
} as const satisfies Record<string, StatusMeta>

export const TRANSACTION_TYPE = {
  recharge: 'Recharge',
  blocage: 'Blocage',
  deblocage: 'Déblocage',
  debit: 'Débit',
  credit: 'Crédit conducteur',
  retrait: 'Retrait',
  remboursement: 'Remboursement',
} as const
export type TransactionType = keyof typeof TRANSACTION_TYPE

export const MOYEN_PAIEMENT = { flooz: 'Flooz', mixx: 'Mixx' } as const
export type MoyenPaiement = keyof typeof MOYEN_PAIEMENT

// Journal d'audit (backend : apps/audit/models.py)
export const AUDIT_RESULTAT = {
  succes: { label: 'Réussi', tone: 'success' },
  refus: { label: 'Refusé', tone: 'warning' },
  echec: { label: 'Échec technique', tone: 'danger' },
} as const satisfies Record<string, StatusMeta>

export const AUDIT_CATEGORIE = {
  metier: { label: 'Métier', tone: 'info' },
  admin: { label: 'Administration', tone: 'neutral' },
  securite: { label: 'Sécurité', tone: 'warning' },
  technique: { label: 'Technique', tone: 'danger' },
} as const satisfies Record<string, StatusMeta>

export const AUDIT_GRAVITE = {
  info: { label: 'Information', tone: 'neutral' },
  avertissement: { label: 'Avertissement', tone: 'warning' },
  critique: { label: 'Critique', tone: 'danger' },
} as const satisfies Record<string, StatusMeta>

export const AUDIT_CANAL = {
  web: 'Web (back-office)',
  mobile: 'Application mobile',
  api: 'API (canal non identifié)',
  systeme: 'Système',
} as const

export const AUDIT_ROLE = {
  passager: 'Passager',
  conducteur: 'Conducteur',
  admin: 'Administrateur',
  systeme: 'Système',
  anonyme: 'Non connecté',
} as const

export const STATUS_DOMAINS = {
  reservation: RESERVATION_STATUS,
  trajet: TRAJET_STATUS,
  kyc: KYC_STATUS,
  compte: COMPTE_STATUS,
  signalement: SIGNALEMENT_STATUS,
  transaction: TRANSACTION_STATUT,
  auditResultat: AUDIT_RESULTAT,
  auditCategorie: AUDIT_CATEGORIE,
  auditGravite: AUDIT_GRAVITE,
} as const

export type StatusDomain = keyof typeof STATUS_DOMAINS
export type StatusValue<D extends StatusDomain> = keyof (typeof STATUS_DOMAINS)[D]

export type ReservationStatus = keyof typeof RESERVATION_STATUS
export type TrajetStatus = keyof typeof TRAJET_STATUS
export type KycStatus = keyof typeof KYC_STATUS
export type CompteStatus = keyof typeof COMPTE_STATUS
export type SignalementStatus = keyof typeof SIGNALEMENT_STATUS
export type TransactionStatut = keyof typeof TRANSACTION_STATUT

export const KYC_TYPE = { passager: 'Passager', conducteur: 'Conducteur' } as const
export type KycType = keyof typeof KYC_TYPE

export const PIECE_TYPE = {
  identite: "Pièce d'identité",
  selfie: 'Selfie',
  permis: 'Permis de conduire',
  carte_grise: 'Carte grise',
  assurance: 'Assurance',
  photo_vehicule: 'Photo du véhicule',
} as const
export type PieceType = keyof typeof PIECE_TYPE
