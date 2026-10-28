import type { ReactNode } from 'react'
import {
  MdAccountBalanceWallet,
  MdGavel,
  MdReportProblem,
  MdVerifiedUser,
} from 'react-icons/md'
import type { AdminRole } from '@/features/auth/types'
import type { DashboardStats } from '../types'

// Files de travail du tableau de bord et rôle qui les traite (D-55).

export type TodoItem = {
  label: string
  count: number
  to: string
  icon: ReactNode
  /** Rôle qui traite cette file (D-55) */
  role: AdminRole
}

export function todoItems(aTraiter: DashboardStats['a_traiter']): TodoItem[] {
  return [
    {
      label: 'Dossiers KYC en attente',
      count: aTraiter.kyc_en_attente,
      to: '/admin/kyc?statut=en_attente',
      icon: <MdVerifiedUser className="h-5 w-5" />,
      role: 'moderation',
    },
    {
      label: 'Signalements ouverts',
      count: aTraiter.signalements_ouverts,
      to: '/admin/reports?statut=ouvert',
      icon: <MdReportProblem className="h-5 w-5" />,
      role: 'moderation',
    },
    {
      label: 'Litiges à trancher',
      count: aTraiter.litiges,
      to: '/admin/bookings?statut=litige',
      icon: <MdGavel className="h-5 w-5" />,
      role: 'moderation',
    },
    {
      // La vue par défaut des transactions est la file des retraits à verser.
      label: 'Retraits à verser',
      count: aTraiter.retraits_en_attente,
      to: '/admin/transactions',
      icon: <MdAccountBalanceWallet className="h-5 w-5" />,
      role: 'finance',
    },
  ]
}

const SANS_DONNEES: DashboardStats['a_traiter'] = {
  kyc_en_attente: 0,
  signalements_ouverts: 0,
  litiges: 0,
  retraits_en_attente: 0,
}

/** Nombre de cartes visibles pour un admin (squelette de chargement). */
export function countTodoCards(peutVoir: (role: AdminRole) => boolean): number {
  return todoItems(SANS_DONNEES).filter((item) => peutVoir(item.role)).length
}
