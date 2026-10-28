import { HiX } from 'react-icons/hi'
import { NavLink } from 'react-router'
import { NAV_ITEMS, type NavBadge } from '@/app/navigation'
import { useAuth } from '@/features/auth/authContext'
import { aLeRole } from '@/features/auth/types'
import { useOpenReportsCount } from '@/features/reports/api'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'
import { Logo } from './Logo'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

const BADGE_LABELS: Record<NavBadge, (count: number) => string> = {
  signalements_ouverts: (count) =>
    count > 1 ? `${formatNumber(count)} signalements ouverts` : '1 signalement ouvert',
}

/** Pastille rouge du menu ; rien à 0. Texte blanc sur danger-600 : contraste AA. */
function MenuBadge({ badge, count }: { badge: NavBadge; count: number | undefined }) {
  if (!count || count <= 0) return null
  return (
    <span className="ml-auto inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-danger-600 px-1.5 py-0.5 text-xs font-bold tabular-nums text-white">
      <span aria-hidden>{count > 99 ? '99+' : formatNumber(count)}</span>
      <span className="sr-only">{` (${BADGE_LABELS[badge](count)})`}</span>
    </span>
  )
}

// Sidebar Horizon re-skinnée Nana Tech.
export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth()
  // Interrogé seulement pour un admin modération (sinon la requête est désactivée).
  const { data: compteur } = useOpenReportsCount()
  const badgeCounts: Record<NavBadge, number | undefined> = {
    signalements_ouverts: compteur?.signalements_ouverts,
  }
  return (
    <>
      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-brand-900/30 xl:hidden"
          onClick={onClose}
        />
      )}
      <aside
        aria-label="Navigation principale"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-surface pb-8 transition-transform duration-200 dark:border-white/10 dark:bg-navy-800 xl:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          aria-label="Fermer le menu"
          className="absolute right-4 top-4 rounded-lg p-1 text-muted xl:hidden"
          onClick={onClose}
        >
          <HiX className="h-5 w-5" />
        </button>

        <Logo className="mx-8 mt-10" />
        <div className="mx-6 mb-6 mt-8 h-px bg-line dark:bg-white/10" />

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_ITEMS.filter((item) => aLeRole(user, item.role)).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/admin'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-4 px-8 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'font-bold text-brand-900 dark:text-white'
                        : 'font-medium text-muted hover:text-brand-900 dark:hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-accent-500' : undefined}>{item.icon}</span>
                      {item.label}
                      {item.badge && (
                        <MenuBadge badge={item.badge} count={badgeCounts[item.badge]} />
                      )}
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l-lg bg-accent-500"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mx-8 mt-6 text-xs text-muted">Même trajet, moins cher.</p>
      </aside>
    </>
  )
}
