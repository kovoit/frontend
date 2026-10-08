import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './authContext'

/** Garde des routes /admin : réservé aux comptes administrateurs connectés. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div role="status" className="flex min-h-full items-center justify-center text-sm text-muted">
        <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-900" />
        Chargement de la session…
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}
