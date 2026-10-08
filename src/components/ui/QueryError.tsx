import { MdErrorOutline } from 'react-icons/md'
import { toApiError } from '@/api/client'
import { Button } from './Button'
import { Card } from './Card'

type QueryErrorProps = {
  error: unknown
  onRetry: () => void
  title?: string
}

/** Erreur de chargement de données (API) affichée dans la page, avec bouton Réessayer. */
export function QueryError({ error, onRetry, title = 'Impossible de charger les données' }: QueryErrorProps) {
  return (
    <Card role="alert" className="items-center gap-3 px-6 py-10 text-center">
      <MdErrorOutline aria-hidden className="h-8 w-8 text-danger-500" />
      <h2 className="font-bold">{title}</h2>
      <p className="text-sm text-muted">{toApiError(error).message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Réessayer
      </Button>
    </Card>
  )
}
