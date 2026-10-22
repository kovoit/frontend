import { MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router'
import type { Id } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useAuditEvents } from '../api'
import { actorLabel } from '../format'

const VIDE = {
  categorie: '',
  resultat: '',
  canal: '',
  role: '',
  recherche: '',
  correlation: '',
  ressource_type: '',
  ressource_id: '',
  debut: '',
  fin: '',
}

/** Actions de l'utilisateur et actions portant sur son compte (traçabilité, pas surveillance). */
export function UserActivityCard({ userId }: { userId: Id }) {
  const filters = { ...VIDE, utilisateur: userId }
  const { data, isPending, isError, error, refetch } = useAuditEvents(filters)
  const events = data?.results.slice(0, 8) ?? []

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Activité récente</h2>
        <Link
          to={`/admin/audit?utilisateur=${userId}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-200"
        >
          Tout le journal
          <MdChevronRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
      <p className="text-xs text-muted">
        Actions métier et administratives liées à ce compte, enregistrées par le serveur.
      </p>
      {isPending ? (
        <Skeleton className="h-32" />
      ) : isError ? (
        <QueryError title="Activité indisponible" error={error} onRetry={() => void refetch()} />
      ) : events.length === 0 ? (
        <p className="text-sm text-muted">Aucune activité enregistrée.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                to={`/admin/audit/${event.id}`}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-bg p-3 text-sm hover:bg-brand-50 dark:bg-navy-900 dark:hover:bg-white/5"
              >
                <span className="font-semibold">{event.libelle}</span>
                <StatusBadge domain="auditResultat" value={event.resultat} />
                <span className="flex-1 text-right text-xs text-muted">
                  {actorLabel(event)} · {formatDateTime(event.survenu_le)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
