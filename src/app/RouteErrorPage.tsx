import { useEffect } from 'react'
import { MdErrorOutline } from 'react-icons/md'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NotFoundPage } from './NotFoundPage'

/** Page « Erreur inattendue » : remplace l'écran blanc quand une page plante. */
export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    // Détail technique uniquement en développement (pas de données personnelles en production).
    if (import.meta.env.DEV) console.error(error)
  }, [error])

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="max-w-md items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
          <MdErrorOutline aria-hidden className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold">Une erreur inattendue est survenue</h1>
        <p className="text-sm text-muted">
          Cette page n'a pas pu s'afficher. Réessayez ; si le problème persiste, contactez l'équipe
          technique.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
          <Link
            to="/admin"
            className="inline-flex items-center rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-brand-50 dark:border-white/10 dark:hover:bg-white/10"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </Card>
    </div>
  )
}
