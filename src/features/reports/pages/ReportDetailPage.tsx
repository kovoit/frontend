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
import { formatDateTime, formatFcfa } from '@/utils/format'
import { useReport } from '../api'
import { ResolutionPanel } from '../components/ResolutionPanel'

const DECISION_LABEL = {
  conducteur: 'en faveur du conducteur',
  passager: 'en faveur du passager',
} as const

export function ReportDetailPage() {
  const id = Number(useParams().id)
  const { data: s, isPending, isError, error, refetch } = useReport(id)

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Chargement du signalement">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-60" />
      </div>
    )
  }
  if (isError) {
    if (toApiError(error).status === 404) return <NotFoundPage />
    return <QueryError error={error} onRetry={() => void refetch()} />
  }

  const res = s.reservation
  const person = (p: typeof s.auteur) => (
    <Link to={`/admin/users/${p.id}`} className="hover:underline">
      {p.prenom} {p.nom}
    </Link>
  )

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/admin/reports" label="Retour aux signalements" />

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">Signalement #{s.id}</h2>
        <StatusBadge domain="signalement" value={s.statut} />
        {res.statut === 'litige' && <StatusBadge domain="reservation" value="litige" />}
      </div>

      {s.statut === 'traite' && (
        <Alert tone="success">
          <p>
            Traité le {s.traite_le ? formatDateTime(s.traite_le) : '—'}
            {s.traite_par && ` par ${s.traite_par.prenom} ${s.traite_par.nom}`}
            {s.decision && ` · litige tranché ${DECISION_LABEL[s.decision]}`}.
          </p>
          <p className="mt-1 font-normal">Résolution : {s.resolution}</p>
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Signalement</h2>
            <blockquote className="rounded-xl border-l-4 border-accent-500 bg-bg p-4 text-sm dark:bg-navy-900">
              {s.motif}
            </blockquote>
            <DescriptionList
              items={[
                { label: 'Signalé par', value: person(s.auteur) },
                { label: 'Personne visée', value: person(s.cible) },
                { label: 'Signalé le', value: formatDateTime(s.cree_le) },
              ]}
            />
          </Card>

          <Card className="gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Réservation #{res.id}</h2>
              <StatusBadge domain="reservation" value={res.statut} />
            </div>
            <DescriptionList
              items={[
                { label: 'Passager', value: person(res.passager) },
                { label: 'Conducteur', value: person(res.conducteur) },
                { label: 'Parcours', value: `${res.point_libelle} → ${res.arrivee_libelle}` },
                { label: 'Départ', value: formatDateTime(res.depart_le) },
                { label: 'Prix', value: formatFcfa(res.prix) },
              ]}
            />
            <div className="flex flex-wrap gap-4 text-sm font-semibold">
              <Link to={`/admin/bookings/${res.id}`} className="text-brand-700 hover:underline dark:text-brand-200">
                Voir la réservation et son historique
              </Link>
              <Link to={`/admin/trips/${res.trajet_id}`} className="text-brand-700 hover:underline dark:text-brand-200">
                Voir le trajet
              </Link>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">{s.statut === 'ouvert' && <ResolutionPanel signalement={s} />}</div>
      </div>
    </div>
  )
}
