import { useState } from 'react'
import { MdEdit } from 'react-icons/md'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/utils/format'
import { useParametres } from '../api'
import { EditParametreDialog } from '../components/EditParametreDialog'
import type { Parametre } from '../types'
import { formatValeur } from '../valeur'

/** Regroupe les paramètres par thème, dans l'ordre renvoyé par l'API. */
function parGroupe(parametres: Parametre[]) {
  const groupes = new Map<string, { libelle: string; parametres: Parametre[] }>()
  for (const parametre of parametres) {
    const groupe = groupes.get(parametre.groupe.code) ?? {
      libelle: parametre.groupe.libelle,
      parametres: [],
    }
    groupe.parametres.push(parametre)
    groupes.set(parametre.groupe.code, groupe)
  }
  return [...groupes.entries()]
}

function ParametreRow({ parametre, onEdit }: { parametre: Parametre; onEdit: () => void }) {
  const auteur = parametre.modifie_par
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm font-semibold">{parametre.description}</p>
        <p className="text-xs text-muted">
          <code>{parametre.cle}</code>
          {auteur &&
            ` · modifié le ${formatDateTime(parametre.modifie_le)} par ${auteur.prenom} ${auteur.nom}`}
        </p>
      </div>
      <span className="text-base font-bold tabular-nums">{formatValeur(parametre)}</span>
      <Button
        variant="ghost"
        className="px-3 py-1.5"
        aria-label={`Modifier : ${parametre.description}`}
        onClick={onEdit}
      >
        <MdEdit aria-hidden className="h-4 w-4" />
        Modifier
      </Button>
    </li>
  )
}

export function SettingsPage() {
  const { data, isPending, isError, error, refetch } = useParametres()
  const [enCours, setEnCours] = useState<Parametre | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="flex flex-col gap-5" role="status" aria-label="Chargement des paramètres">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  if (isError) return <QueryError error={error} onRetry={() => void refetch()} />

  return (
    <div className="flex flex-col gap-5">
      <Alert tone="info">
        Ces valeurs pilotent les règles métier de Kovoit (prix, correspondance, délais,
        suspensions). Une modification s'applique immédiatement, dans l'application mobile comme
        ici.
      </Alert>
      {notice && <Alert tone="success">{notice}</Alert>}

      {parGroupe(data).map(([code, groupe]) => (
        <Card key={code} className="gap-1 p-5">
          <h2 className="text-lg font-bold">{groupe.libelle}</h2>
          <ul aria-label={groupe.libelle} className="divide-y divide-line dark:divide-white/10">
            {groupe.parametres.map((parametre) => (
              <ParametreRow
                key={parametre.cle}
                parametre={parametre}
                onEdit={() => {
                  setNotice(null)
                  setEnCours(parametre)
                }}
              />
            ))}
          </ul>
        </Card>
      ))}

      {enCours && (
        <EditParametreDialog
          parametre={enCours}
          onClose={() => setEnCours(null)}
          onSaved={(parametre) => {
            setEnCours(null)
            setNotice(`${parametre.description} Nouvelle valeur : ${formatValeur(parametre)}.`)
          }}
        />
      )}
    </div>
  )
}
