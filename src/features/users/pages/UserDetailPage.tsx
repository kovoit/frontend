import { useState } from 'react'
import { MdChevronRight, MdStar } from 'react-icons/md'
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
import { KYC_TYPE } from '@/config/enums'
import { formatDate, formatDateTime, formatNumber, formatPercent } from '@/utils/format'
import { useUser } from '../api'
import { AccountActions } from '../components/AccountActions'
import type { UserDetail } from '../types'

function ReliabilityCard({ user }: { user: UserDetail }) {
  const { reservations_30j, annulations_tardives_30j, absences_30j } = user.fiabilite_detail
  return (
    <Card className="gap-4 p-5">
      <h2 className="text-lg font-bold">Fiabilité (30 jours)</h2>
      <p className="text-3xl font-bold tabular-nums">
        {user.fiabilite === null ? '—' : formatPercent(user.fiabilite)}
      </p>
      <DescriptionList
        items={[
          { label: 'Réservations', value: formatNumber(reservations_30j) },
          { label: 'Annulations tardives', value: formatNumber(annulations_tardives_30j) },
          { label: 'Absences', value: formatNumber(absences_30j) },
          {
            label: 'Note moyenne',
            value:
              user.note_moyenne === null ? (
                '—'
              ) : (
                <span className="inline-flex items-center gap-1">
                  {user.note_moyenne.toFixed(1).replace('.', ',')}
                  <MdStar aria-hidden className="h-4 w-4 text-accent-500" />
                  <span className="text-muted">({formatNumber(user.nb_notes)} avis)</span>
                </span>
              ),
          },
        ]}
      />
      {user.fiabilite === null && (
        <p className="text-xs text-muted">Aucune réservation sur les 30 derniers jours.</p>
      )}
    </Card>
  )
}

export function UserDetailPage() {
  const id = Number(useParams().id)
  const { data: user, isPending, isError, error, refetch } = useUser(id)
  // Message lié à la fiche affichée (évite de le montrer sur une autre fiche après navigation).
  const [notice, setNotice] = useState<{ userId: number; text: string } | null>(null)

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Chargement de la fiche">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
      </div>
    )
  }
  if (isError) {
    if (toApiError(error).status === 404) return <NotFoundPage />
    return <QueryError error={error} onRetry={() => void refetch()} />
  }

  const fullName = `${user.prenom} ${user.nom}`

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/admin/users" label="Retour aux utilisateurs" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-lg font-bold text-white"
          >
            {user.prenom[0]}
            {user.nom[0]}
          </span>
          <h2 className="text-xl font-bold">{fullName}</h2>
          <StatusBadge domain="compte" value={user.statut_compte} />
        </div>
        <AccountActions user={user} onDone={(text) => setNotice({ userId: user.id, text })} />
      </div>

      {notice?.userId === user.id && <Alert tone="success">{notice.text}</Alert>}
      {user.statut_compte === 'suspendu' && (
        <Alert tone="warning">
          <p>
            Compte suspendu
            {user.suspendu_jusqu_au
              ? ` jusqu'au ${formatDateTime(user.suspendu_jusqu_au)}`
              : ' jusqu’à réactivation manuelle'}
            .
          </p>
          {user.motif_suspension && (
            <p className="mt-1 font-normal">Motif : {user.motif_suspension}</p>
          )}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Identité et contact</h2>
            <DescriptionList
              items={[
                { label: 'Email', value: user.email },
                { label: 'Téléphone', value: user.telephone },
                {
                  label: 'Téléphone vérifié',
                  value: user.telephone_verifie_le ? formatDateTime(user.telephone_verifie_le) : 'Non',
                },
                { label: 'Inscrit le', value: formatDate(user.cree_le) },
                {
                  label: 'Mode actif',
                  value: user.mode_actif === 'conducteur' ? 'Conducteur' : 'Passager',
                },
              ]}
            />
          </Card>

          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Dossiers KYC</h2>
            {user.dossiers_kyc.length === 0 ? (
              <p className="text-sm text-muted">Aucun dossier soumis.</p>
            ) : (
              <ul className="divide-y divide-line dark:divide-white/10">
                {user.dossiers_kyc.map((dossier) => (
                  <li key={dossier.id}>
                    <Link
                      to={`/admin/kyc/${dossier.id}`}
                      className="flex flex-wrap items-center gap-3 py-3 hover:bg-bg dark:hover:bg-white/5"
                    >
                      <span className="w-28 text-sm font-semibold">{KYC_TYPE[dossier.type]}</span>
                      <StatusBadge domain="kyc" value={dossier.statut} />
                      <span className="flex-1 text-sm text-muted">
                        {dossier.soumis_le ? `Soumis le ${formatDate(dossier.soumis_le)}` : ''}
                        {dossier.motif_rejet ? ` · ${dossier.motif_rejet}` : ''}
                      </span>
                      <MdChevronRight aria-hidden className="h-5 w-5 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Dernières notes reçues</h2>
            {user.notes_recues.length === 0 ? (
              <p className="text-sm text-muted">Aucune note pour le moment.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {user.notes_recues.map((note) => (
                  <li key={note.id} className="rounded-xl bg-bg p-3 dark:bg-navy-900">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold">
                        {note.auteur.prenom} {note.auteur.nom}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        {note.note}/5 <MdStar aria-hidden className="h-4 w-4 text-accent-500" />
                        <span className="text-muted">· {formatDate(note.cree_le)}</span>
                      </span>
                    </div>
                    {note.commentaire && <p className="mt-1 text-sm text-muted">{note.commentaire}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <ReliabilityCard user={user} />
          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Véhicule</h2>
            {user.vehicule ? (
              <DescriptionList
                items={[
                  { label: 'Véhicule', value: `${user.vehicule.marque} ${user.vehicule.modele}` },
                  { label: 'Couleur', value: user.vehicule.couleur },
                  { label: 'Immatriculation', value: user.vehicule.immatriculation },
                  { label: 'Places', value: user.vehicule.nb_places },
                ]}
              />
            ) : (
              <p className="text-sm text-muted">Aucun véhicule déclaré.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
