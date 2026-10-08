import type { ReactNode } from 'react'
import { MdCheckCircle, MdChevronRight, MdGavel, MdReportProblem, MdVerifiedUser } from 'react-icons/md'
import { Link } from 'react-router'
import { formatNumber } from '@/utils/format'
import type { DashboardStats } from '../types'

type TodoItem = {
  label: string
  count: number
  to: string
  icon: ReactNode
}

// Files de travail : chaque carte ouvre la liste filtrée correspondante.
export function TodoCards({ aTraiter }: { aTraiter: DashboardStats['a_traiter'] }) {
  const items: TodoItem[] = [
    {
      label: 'Dossiers KYC en attente',
      count: aTraiter.kyc_en_attente,
      to: '/admin/kyc?statut=en_attente',
      icon: <MdVerifiedUser className="h-5 w-5" />,
    },
    {
      label: 'Signalements ouverts',
      count: aTraiter.signalements_ouverts,
      to: '/admin/reports?statut=ouvert',
      icon: <MdReportProblem className="h-5 w-5" />,
    },
    {
      label: 'Litiges à trancher',
      count: aTraiter.litiges,
      to: '/admin/bookings?statut=litige',
      icon: <MdGavel className="h-5 w-5" />,
    },
  ]

  return (
    <section aria-labelledby="todo-title">
      <h2 id="todo-title" className="mb-3 text-lg font-bold">
        À traiter
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const pending = item.count > 0
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className="group flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-brand-300 dark:border-white/10 dark:bg-navy-800 dark:shadow-none"
              >
                <span
                  className={
                    pending
                      ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-700/30 dark:text-accent-200'
                      : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700 dark:bg-success-700/30 dark:text-success-100'
                  }
                >
                  {pending ? item.icon : <MdCheckCircle className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-2xl font-bold tabular-nums">
                    {formatNumber(item.count)}
                  </span>
                  <span className="block text-sm text-muted">
                    {pending ? item.label : `${item.label} : rien à traiter`}
                  </span>
                </span>
                <MdChevronRight
                  aria-hidden
                  className="h-5 w-5 text-muted transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
