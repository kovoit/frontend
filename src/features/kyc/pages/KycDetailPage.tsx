import { Link, useParams } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { BackLink } from '@/components/ui/BackLink'
import { Card } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KYC_TYPE } from '@/config/enums'
import { NotFoundPage } from '@/app/NotFoundPage'
import { toApiError } from '@/api/client'
import { formatDateTime } from '@/utils/format'
import { useKycDossier } from '../api'
import { DecisionPanel } from '../components/DecisionPanel'
import { PieceViewer } from '../components/PieceViewer'

export function KycDetailPage() {
  const id = useParams().id ?? ''
  const { data: dossier, isPending, isError, error, refetch } = useKycDossier(id)

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Chargement du dossier">
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

  const fullName = `${dossier.utilisateur.prenom} ${dossier.utilisateur.nom}`

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/admin/kyc" label="Retour aux dossiers" />

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">
          Dossier {KYC_TYPE[dossier.type].toLowerCase()} · {fullName}
        </h2>
        <StatusBadge domain="kyc" value={dossier.statut} />
      </div>

      {dossier.statut === 'verifie' && (
        <Alert tone="success">
          Dossier validé le {dossier.traite_le ? formatDateTime(dossier.traite_le) : '—'}
          {dossier.traite_par && ` par ${dossier.traite_par.prenom} ${dossier.traite_par.nom}`}.
        </Alert>
      )}
      {dossier.statut === 'rejete' && (
        <Alert tone="danger">
          <p>
            Dossier rejeté le {dossier.traite_le ? formatDateTime(dossier.traite_le) : '—'}
            {dossier.traite_par && ` par ${dossier.traite_par.prenom} ${dossier.traite_par.nom}`}.
          </p>
          <p className="mt-1 font-normal">Motif : {dossier.motif_rejet}</p>
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-bold">Pièces justificatives</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {dossier.pieces.map((piece) => (
                <PieceViewer key={piece.id} piece={piece} ownerName={fullName} />
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {dossier.statut === 'en_attente' && <DecisionPanel dossier={dossier} />}

          <Card className="gap-4 p-5">
            <h2 className="text-lg font-bold">Demandeur</h2>
            <DescriptionList
              items={[
                { label: 'Nom', value: fullName },
                { label: 'Téléphone', value: dossier.utilisateur.telephone },
                { label: 'Email', value: dossier.utilisateur.email },
                {
                  label: 'Soumis le',
                  value: dossier.soumis_le ? formatDateTime(dossier.soumis_le) : '—',
                },
              ]}
            />
            <Link
              to={`/admin/users/${dossier.utilisateur.id}`}
              className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
            >
              Voir la fiche utilisateur
            </Link>
          </Card>

          {dossier.vehicule && (
            <Card className="gap-4 p-5">
              <h2 className="text-lg font-bold">Véhicule déclaré</h2>
              <DescriptionList
                items={[
                  {
                    label: 'Véhicule',
                    value: `${dossier.vehicule.marque} ${dossier.vehicule.modele}`,
                  },
                  { label: 'Couleur', value: dossier.vehicule.couleur },
                  { label: 'Immatriculation', value: dossier.vehicule.immatriculation },
                  { label: 'Places', value: dossier.vehicule.nb_places },
                ]}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
