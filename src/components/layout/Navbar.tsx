import { FiAlignJustify } from 'react-icons/fi'
import { MdLogout } from 'react-icons/md'
import { RiMoonFill, RiSunFill } from 'react-icons/ri'
import { useAuth } from '@/features/auth/authContext'
import { useDarkMode } from '@/hooks/useDarkMode'

type NavbarProps = {
  title: string
  onOpenSidenav: () => void
}

// Navbar Horizon simplifiée : fil d'Ariane, titre de section, menu mobile, mode sombre, compte.
export function Navbar({ title, onOpenSidenav }: NavbarProps) {
  const { dark, toggle } = useDarkMode()
  const { user, logout } = useAuth()
  const initials = user ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase() : ''

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-bg/80 py-4 backdrop-blur-xl dark:bg-navy-900/80">
      <div className="min-w-0">
        <p className="text-sm text-muted">Administration / {title}</p>
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 shadow-soft dark:border-white/10 dark:bg-navy-800">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="rounded-full p-2 text-muted hover:text-brand-900 dark:hover:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className="rounded-full p-2 text-muted hover:text-brand-900 dark:hover:text-white"
          onClick={toggle}
        >
          {dark ? <RiSunFill className="h-4 w-4" /> : <RiMoonFill className="h-4 w-4" />}
        </button>
        {user && (
          <>
            <div
              title={`${user.prenom} ${user.nom} · ${user.email}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white"
            >
              <span aria-hidden>{initials}</span>
              <span className="sr-only">
                Connecté en tant que {user.prenom} {user.nom}
              </span>
            </div>
            <button
              type="button"
              aria-label="Se déconnecter"
              className="rounded-full p-2 text-muted hover:text-danger-600"
              onClick={() => void logout()}
            >
              <MdLogout className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  )
}
