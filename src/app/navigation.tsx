import type { ReactNode } from 'react'
import type { AdminRole } from '@/features/auth/types'
import {
  MdDashboard,
  MdDirectionsCar,
  MdManageSearch,
  MdEventSeat,
  MdPeople,
  MdReceiptLong,
  MdReportProblem,
  MdSettings,
  MdVerifiedUser,
} from 'react-icons/md'

/** Compteur affiché en badge à côté d'une entrée du menu */
export type NavBadge = 'signalements_ouverts'

export type NavItem = {
  label: string
  /** Chemin absolu sous /admin */
  to: string
  icon: ReactNode
  /** Rôle requis (absent : tout administrateur) */
  role?: AdminRole
  /** Badge rouge (masqué à 0) */
  badge?: NavBadge
}

const iconClass = 'h-5 w-5'

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/admin', icon: <MdDashboard className={iconClass} /> },
  {
    label: 'Dossiers KYC',
    to: '/admin/kyc',
    icon: <MdVerifiedUser className={iconClass} />,
    role: 'moderation',
  },
  {
    label: 'Utilisateurs',
    to: '/admin/users',
    icon: <MdPeople className={iconClass} />,
    role: 'moderation',
  },
  {
    label: 'Trajets',
    to: '/admin/trips',
    icon: <MdDirectionsCar className={iconClass} />,
    role: 'moderation',
  },
  {
    label: 'Réservations',
    to: '/admin/bookings',
    icon: <MdEventSeat className={iconClass} />,
    role: 'moderation',
  },
  {
    label: 'Signalements & litiges',
    to: '/admin/reports',
    icon: <MdReportProblem className={iconClass} />,
    role: 'moderation',
    badge: 'signalements_ouverts',
  },
  {
    label: 'Transactions',
    to: '/admin/transactions',
    icon: <MdReceiptLong className={iconClass} />,
    role: 'finance',
  },
  {
    label: 'Audit et activités',
    to: '/admin/audit',
    icon: <MdManageSearch className={iconClass} />,
    role: 'audit',
  },
  { label: 'Paramètres', to: '/admin/settings', icon: <MdSettings className={iconClass} /> },
]

/** Section du chemin courant (le plus long préfixe gagne). */
export function getSection(pathname: string): NavItem | undefined {
  return [...NAV_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
}

/** Libellé de la section correspondant au chemin courant (le plus long préfixe gagne). */
export function getSectionLabel(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  return match?.label ?? 'Tableau de bord'
}
