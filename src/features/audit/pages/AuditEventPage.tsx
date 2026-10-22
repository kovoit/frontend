import { Link, useParams } from 'react-router'
import { toApiError } from '@/api/client'
import { NotFoundPage } from '@/app/NotFoundPage'
import { BackLink } from '@/components/ui/BackLink'
import { Card } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AUDIT_CANAL, AUDIT_ROLE } from '@/config/enums'
import { formatDateTime } from '@/utils/format'
import { useAuditEvent } from '../api'
import {
  actorLabel,
  displayValue,
  eventSummary,
  NON_DISPONIBLE,
  resourceLabel,
  resourcePath,
} from '../format'

const lien = 'font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-200'

export function AuditEventPage() {
  const id = useParams().id ?? ''
  const { data: event, isPending, isError, error, refetch } = useAuditEvent(id)

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Chargement de l’événement">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-80" />
      </div>
    )
  }
  if (isError) {
    if (toApiError(error).status === 404) return <NotFoundPage />
    return <QueryError error={error} onRetry={() => void refetch()} />
  }

  const path = resourcePath(event)
  const details = Object.entries(event.details)
  const changes = Object.entries(event.changements)

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/admin/audit" label="Retour au journal" />
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{event.libelle}</h2>
        <StatusBadge domain="auditResultat" value={event.resultat} />
        <StatusBadge domain="auditCategorie" value={event.categorie} />
        <StatusBadge domain="auditGravite" value={event.gravite} />
      </div>
      <p className="text-sm">{eventSummary(event)}</p>

      <Card className="gap-4 p-5">
        <DescriptionList
          items={[
            {
              label: 'Identifiant de l’événement',
              value: <code className="text-xs">{event.id}</code>,
            },
            { label: 'Action', value: <code className="text-xs">{event.action}</code> },
            { label: 'Survenu le', value: formatDateTime(event.survenu_le) },
            { label: 'Enregistré le', value: formatDateTime(event.enregistre_le) },
            {
              label: 'Acteur',
              value:
                event.acteur && !event.acteur.supprime ? (
                  <Link to={`/admin/users/${event.acteur.id}`} className={lien}>
                    {actorLabel(event)}
                  </Link>
                ) : (
                  actorLabel(event)
                ),
            },
            { label: 'Rôle', value: AUDIT_ROLE[event.acteur_role] ?? NON_DISPONIBLE },
            { label: 'Canal d’origine', value: AUDIT_CANAL[event.canal] ?? event.canal },
            {
              label: 'Ressource',
              value: path ? (
                <Link to={path} className={lien}>
                  {resourceLabel(event)}
                </Link>
              ) : (
                resourceLabel(event)
              ),
            },
            { label: 'Code de motif', value: event.code_motif || '—' },
            {
              label: 'Identifiant de requête',
              value: event.request_id ? (
                <Link to={`/admin/audit?correlation=${event.request_id}`} className={lien}>
                  <code className="text-xs">{event.request_id}</code>
                </Link>
              ) : (
                'Aucun (tâche planifiée ou commande)'
              ),
            },
          ]}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <h3 className="font-bold">Changements</h3>
          {changes.length === 0 ? (
            <p className="text-sm text-muted">Aucun changement de valeur enregistré.</p>
          ) : (
            <table className="text-sm">
              <caption className="sr-only">Valeurs avant et après</caption>
              <thead>
                <tr className="text-left text-xs uppercase text-muted">
                  <th className="py-1 pr-4">Champ</th>
                  <th className="py-1 pr-4">Avant</th>
                  <th className="py-1">Après</th>
                </tr>
              </thead>
              <tbody>
                {changes.map(([champ, [avant, apres]]) => (
                  <tr key={champ} className="border-t border-line dark:border-white/10">
                    <td className="py-2 pr-4 font-semibold">{champ}</td>
                    <td className="py-2 pr-4">{displayValue(avant)}</td>
                    <td className="py-2">{displayValue(apres)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card className="gap-3 p-5">
          <h3 className="font-bold">Données complémentaires</h3>
          {details.length === 0 ? (
            <p className="text-sm text-muted">Aucune donnée complémentaire.</p>
          ) : (
            <DescriptionList
              items={details.map(([label, value]) => ({ label, value: displayValue(value) }))}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
