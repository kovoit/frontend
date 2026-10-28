import { MdCheckCircle, MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router'
import type { AdminRole } from '@/features/auth/types'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'
import type { DashboardStats } from '../types'
import { todoItems } from './todoItems'

type TodoCardsProps = {
  aTraiter: DashboardStats['a_traiter']
  /** Vrai si l'admin connecté a ce rôle */
  peutVoir: (role: AdminRole) => boolean
}

// Files de travail : chaque carte ouvre la liste filtrée correspondante. Un admin ne voit que
// les cartes de ses rôles ; sans aucun rôle concerné, la section n'est pas affichée.
export function TodoCards({ aTraiter, peutVoir }: TodoCardsProps) {
  const items = todoItems(aTraiter).filter((item) => peutVoir(item.role))
  if (items.length === 0) return null

  return (
    <section aria-labelledby="todo-title">
      <h2 id="todo-title" className="mb-3 text-lg font-bold">
        À traiter
      </h2>
      <ul
        className={cn(
          'grid gap-4',
          items.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3',
        )}
      >
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
