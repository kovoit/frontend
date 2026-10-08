import type { ReactNode } from 'react'
import {
  MdDashboard,
  MdDirectionsCar,
  MdEventSeat,
  MdPeople,
  MdReceiptLong,
  MdReportProblem,
  MdSettings,
  MdVerifiedUser,
} from 'react-icons/md'
import { env } from '@/config/env'

export type NavItem = {
  label: string
  /** Chemin absolu sous /admin */
  to: string
  icon: ReactNode
}

const iconClass = 'h-5 w-5'

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/admin', icon: <MdDashboard className={iconClass} /> },
  { label: 'Dossiers KYC', to: '/admin/kyc', icon: <MdVerifiedUser className={iconClass} /> },
  { label: 'Utilisateurs', to: '/admin/users', icon: <MdPeople className={iconClass} /> },
  { label: 'Trajets', to: '/admin/trips', icon: <MdDirectionsCar className={iconClass} /> },
  { label: 'Réservations', to: '/admin/bookings', icon: <MdEventSeat className={iconClass} /> },
  {
    label: 'Signalements & litiges',
    to: '/admin/reports',
    icon: <MdReportProblem className={iconClass} />,
  },
  ...(env.featureWallet
    ? [
        {
          label: 'Transactions',
          to: '/admin/transactions',
          icon: <MdReceiptLong className={iconClass} />,
        },
      ]
    : []),
  { label: 'Paramètres', to: '/admin/settings', icon: <MdSettings className={iconClass} /> },
]

/** Libellé de la section correspondant au chemin courant (le plus long préfixe gagne). */
export function getSectionLabel(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  return match?.label ?? 'Tableau de bord'
}
