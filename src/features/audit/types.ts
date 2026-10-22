import type { Id } from '@/api/types'
import type {
  AUDIT_CANAL,
  AUDIT_CATEGORIE,
  AUDIT_GRAVITE,
  AUDIT_RESULTAT,
  AUDIT_ROLE,
} from '@/config/enums'

// Contrat de l'API (backend : apps/audit/api) — lecture seule, réservée aux administrateurs :
//   GET /admin/audit/evenements/?filtres&page   liste paginée, plus récents d'abord
//   GET /admin/audit/evenements/:id/            détail
//   GET /admin/audit/flux/?depuis=ISO&filtres   nouveaux événements (flux temps réel)
//   GET /admin/audit/statistiques/?periode=7j|30j|mois
// Les événements sont produits par le serveur (actions mobiles et web), jamais par le front.

export type AuditResultat = keyof typeof AUDIT_RESULTAT
export type AuditCategorie = keyof typeof AUDIT_CATEGORIE
export type AuditGravite = keyof typeof AUDIT_GRAVITE
export type AuditCanal = keyof typeof AUDIT_CANAL
export type AuditRole = keyof typeof AUDIT_ROLE

export type AuditActeur = {
  id: Id
  prenom: string | null
  nom: string | null
  email: string | null
  /** Compte supprimé depuis l'événement : l'identifiant reste, le nom n'est plus connu */
  supprime: boolean
}

export type AuditEvent = {
  id: Id
  survenu_le: string
  enregistre_le: string
  categorie: AuditCategorie
  /** Code stable de l'action (ex. reservation.demander) */
  action: string
  libelle: string
  resultat: AuditResultat
  gravite: AuditGravite
  canal: AuditCanal
  acteur: AuditActeur | null
  acteur_role: AuditRole
  ressource_type: string
  ressource_id: string
  code_motif: string
  request_id: string
  details: Record<string, unknown>
  /** { champ: [ancienne valeur, nouvelle valeur] } */
  changements: Record<string, [unknown, unknown]>
}

export type AuditFlux = { evenements: AuditEvent[]; tronque: boolean; serveur_le: string }

export const AUDIT_PERIODES = {
  '7j': '7 derniers jours',
  '30j': '30 derniers jours',
  mois: 'Mois en cours',
} as const
export type AuditPeriode = keyof typeof AUDIT_PERIODES

export type AuditStats = {
  debut: string
  fin: string
  total: number
  metier_succes: number
  /** Refus métier et échecs */
  metier_refus: number
  securite: number
  securite_refus: number
  technique: number
  admin: number
  /** Passagers et conducteurs ayant au moins un événement sur la période */
  utilisateurs_actifs: number
  derniere_activite: string | null
}

/** Filtres envoyés tels quels à l'API (chaîne vide = pas de filtre). */
export type AuditFilters = {
  categorie: string
  resultat: string
  canal: string
  role: string
  recherche: string
  utilisateur: string
  correlation: string
  ressource_type: string
  ressource_id: string
  debut: string
  fin: string
}

export const AUDIT_FILTER_KEYS = [
  'categorie',
  'resultat',
  'canal',
  'role',
  'recherche',
  'utilisateur',
  'correlation',
  'ressource_type',
  'ressource_id',
  'debut',
  'fin',
] as const satisfies ReadonlyArray<keyof AuditFilters>
