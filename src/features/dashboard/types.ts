import type { ReservationStatus } from '@/config/enums'

// Contrat attendu de l'API (à implémenter côté backend DRF) :
//   GET /admin/stats/?periode=7j|30j|mois → 200 DashboardStats
// Tous les agrégats sont calculés par le backend ; le front ne fait que les afficher.

export const PERIODES = {
  '7j': '7 derniers jours',
  '30j': '30 derniers jours',
  mois: 'Mois en cours',
} as const

export type Periode = keyof typeof PERIODES

export type DashboardStats = {
  periode: { code: Periode; debut: string; fin: string }
  indicateurs: {
    trajets_publies: number
    trajets_termines: number
    passagers_transportes: number
    /** Somme payée par les passagers aux conducteurs (FCFA), cf. PRD « Économies affichées » */
    economies_realisees: number
    /** Utilisateurs avec un KYC (passager ou conducteur) au statut verifie, à la fin de la période */
    utilisateurs_verifies: number
    conducteurs_verifies: number
  }
  /** Files de travail de l'administrateur, à l'instant de la requête */
  a_traiter: {
    kyc_en_attente: number
    signalements_ouverts: number
    litiges: number
  }
  /** Un point par jour de la période (date ISO AAAA-MM-JJ, heure de Lomé) */
  evolution: Array<{ date: string; trajets: number; passagers: number }>
  /** Réservations créées sur la période, par statut actuel */
  reservations_par_statut: Record<ReservationStatus, number>
}
