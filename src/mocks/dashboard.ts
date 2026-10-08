import type { ReservationStatus } from '@/config/enums'
import type { DashboardStats, Periode } from '@/features/dashboard/types'

const DAY_MS = 24 * 60 * 60 * 1000

// Bruit déterministe : mêmes chiffres à chaque rechargement pour une date donnée.
function noise(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function periodDays(periode: Periode, today: Date): Date[] {
  const count =
    periode === '7j' ? 7 : periode === '30j' ? 30 : today.getUTCDate() // mois en cours
  return Array.from({ length: count }, (_, i) => new Date(today.getTime() - (count - 1 - i) * DAY_MS))
}

/** Statistiques fictives mais cohérentes (Lomé, pilote de quelques dizaines de conducteurs). */
export function buildMockStats(periode: Periode, today = new Date()): DashboardStats {
  const days = periodDays(periode, today)
  const evolution = days.map((day) => {
    const seed = Math.floor(day.getTime() / DAY_MS)
    const weekday = day.getUTCDay()
    const weekend = weekday === 0 || weekday === 6
    const trajets = Math.round((weekend ? 18 : 42) + noise(seed) * 14)
    const passagers = Math.round(trajets * (1.6 + noise(seed + 1) * 0.6))
    return { date: isoDay(day), trajets, passagers }
  })

  const trajetsTermines = evolution.reduce((sum, d) => sum + d.trajets, 0)
  const passagers = evolution.reduce((sum, d) => sum + d.passagers, 0)
  const prixMoyen = 290 // grille PRD : 200 / 300 / 500 F

  const parStatut: Record<ReservationStatus, number> = {
    demandee: Math.round(passagers * 0.02),
    acceptee: Math.round(passagers * 0.03),
    refusee: Math.round(passagers * 0.04),
    annulee: Math.round(passagers * 0.06),
    absent: Math.round(passagers * 0.015),
    en_cours: Math.round(passagers * 0.005),
    terminee: Math.round(passagers * 0.05),
    litige: Math.max(1, Math.round(passagers * 0.003)),
    cloturee: passagers,
  }

  return {
    periode: { code: periode, debut: evolution[0]!.date, fin: evolution.at(-1)!.date },
    indicateurs: {
      trajets_publies: Math.round(trajetsTermines * 1.12),
      trajets_termines: trajetsTermines,
      passagers_transportes: passagers,
      economies_realisees: passagers * prixMoyen,
      utilisateurs_verifies: 412,
      conducteurs_verifies: 87,
    },
    a_traiter: {
      kyc_en_attente: 14,
      signalements_ouverts: 3,
      litiges: parStatut.litige,
    },
    evolution,
    reservations_par_statut: parStatut,
  }
}
