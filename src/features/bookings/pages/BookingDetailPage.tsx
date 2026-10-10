import { MdChevronRight, MdLock } from 'react-icons/md'
import { Link, useParams } from 'react-router'
import { toApiError } from '@/api/client'
import { NotFoundPage } from '@/app/NotFoundPage'
import { Alert } from '@/components/ui/Alert'
import { BackLink } from '@/components/ui/BackLink'
import { Card } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime, formatFcfa, formatKm, shortId } from '@/utils/format'
import { useBooking } from '../api'
import { StatusTimeline } from '../components/StatusTimeline'

export function BookingDetailPage() {
  const id = useParams().id ?? ''
  const { data: res, isPending, isError, error, refetch } = useBooking(id)

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Chargement de la réservation">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-72" />
      </div>
    )
  }
  if (isError) {
    if (toApiError(error).status === 404) return <NotFoundPage />
    return <QueryError error={error} onRetry={() => void refetch()} />
  }

  const openReport = res.signalements.find((s) => s.statut === 'ouvert')

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/admin/bookings" label="Retour aux réservations" />

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Réservation #{shortId(res.id)}</h2>
        <StatusBadge domain="reservation" value={res.statut} />
      </div>

      {res.statut === 'litige' && (
        <Alert tone="danger">
          Litige en cours : le montant est gelé jusqu'à l'arbitrage.{' '}
          {openReport && (
            <Link to={`/admin/reports/${openReport.id}`} className="underline">
              Trancher le litige
            </Link>
          )}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Parcours et montant</h2>
            <DescriptionList
              items={[
                {
                  label: 'Prise en charge',
                  value: `${res.point.libelle}${res.point.ordre > 0 ? ` (point n° ${res.point.ordre})` : ''}`,
                },
                { label: 'Arrivée du passager', value: res.arrivee.libelle },
                { label: 'Départ du trajet', value: formatDateTime(res.depart_le) },
                { label: 'Distance facturée', value: formatKm(res.distance_km) },
                { label: 'Prix', value: formatFcfa(res.prix) },
                { label: 'Frais de service', value: formatFcfa(res.frais_service) },
              ]}
            />
            <p className="flex items-center gap-2 text-xs text-muted">
              <MdLock aria-hidden className="h-4 w-4" />
              Le code de départ n'est jamais affiché : il est stocké haché et seul le passager le connaît.
            </p>
          </Card>

          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Historique</h2>
            <StatusTimeline historique={res.historique} />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Personnes</h2>
            <DescriptionList
              items={[
                {
                  label: 'Passager',
                  value: (
                    <Link to={`/admin/users/${res.passager.id}`} className="hover:underline">
                      {res.passager.prenom} {res.passager.nom}
                    </Link>
                  ),
                },
                {
                  label: 'Conducteur',
                  value: (
                    <Link to={`/admin/users/${res.conducteur.id}`} className="hover:underline">
                      {res.conducteur.prenom} {res.conducteur.nom}
                    </Link>
                  ),
                },
              ]}
            />
            <Link
              to={`/admin/trips/${res.trajet_id}`}
              className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
            >
              Voir le trajet
            </Link>
          </Card>

          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Signalements</h2>
            {res.signalements.length === 0 ? (
              <p className="text-sm text-muted">Aucun signalement.</p>
            ) : (
              <ul className="divide-y divide-line dark:divide-white/10">
                {res.signalements.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/admin/reports/${s.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-bg dark:hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-sm">{s.motif}</span>
                        <span className="text-xs text-muted">{formatDate(s.cree_le)}</span>
                      </span>
                      <StatusBadge domain="signalement" value={s.statut} />
                      <MdChevronRight aria-hidden className="h-5 w-5 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
