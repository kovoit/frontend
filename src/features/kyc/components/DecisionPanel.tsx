import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdCheck, MdClose } from 'react-icons/md'
import { z } from 'zod'
import { toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { KYC_TYPE } from '@/config/enums'
import { useRejectKyc, useValidateKyc } from '../api'
import type { KycDossierDetail } from '../types'

const rejectSchema = z.object({
  motif_rejet: z
    .string()
    .trim()
    .min(10, 'Précisez le motif (10 caractères minimum) : il sera communiqué au demandeur.')
    .max(500, '500 caractères maximum.'),
})
type RejectForm = z.infer<typeof rejectSchema>

const UNLOCKS = {
  passager: 'réserver des places',
  conducteur: 'publier des trajets (avec un véhicule déclaré)',
} as const

/** Décision sur un dossier en attente : validation confirmée, rejet avec motif obligatoire (PRD). */
export function DecisionPanel({ dossier }: { dossier: KycDossierDetail }) {
  const [dialog, setDialog] = useState<'valider' | 'rejeter' | null>(null)
  const validate = useValidateKyc(dossier.id)
  const reject = useRejectKyc(dossier.id)
  const fullName = `${dossier.user.prenom} ${dossier.user.nom}`

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) })

  const close = () => {
    setDialog(null)
    validate.reset()
    reject.reset()
    reset()
  }

  const onReject = handleSubmit((values) =>
    reject.mutate(values, {
      onSuccess: () => setDialog(null),
      onError: (error) => {
        const message = toApiError(error).fieldErrors.motif_rejet?.[0]
        if (message) setError('motif_rejet', { message })
      },
    }),
  )

  const mutationError = validate.error ?? (reject.isError && !errors.motif_rejet ? reject.error : null)

  return (
    <Card className="gap-4 p-5">
      <div>
        <h2 className="text-lg font-bold">Décision</h2>
        <p className="mt-1 text-sm text-muted">
          Vérifiez que chaque pièce est lisible, correspond à l'identité déclarée et que le selfie
          correspond à la pièce d'identité.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setDialog('valider')}>
          <MdCheck aria-hidden className="h-4 w-4" />
          Valider le dossier
        </Button>
        <Button variant="danger" onClick={() => setDialog('rejeter')}>
          <MdClose aria-hidden className="h-4 w-4" />
          Rejeter
        </Button>
      </div>

      <Modal
        open={dialog === 'valider'}
        onClose={close}
        title="Valider ce dossier ?"
        description={
          <>
            Le dossier {KYC_TYPE[dossier.type].toLowerCase()} de <strong>{fullName}</strong> passera
            au statut « Vérifié ». Cette personne pourra {UNLOCKS[dossier.type]}.
          </>
        }
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Annuler
            </Button>
            <Button
              disabled={validate.isPending}
              onClick={() => validate.mutate({}, { onSuccess: () => setDialog(null) })}
            >
              {validate.isPending ? 'Validation…' : 'Confirmer la validation'}
            </Button>
          </>
        }
      >
        {mutationError && <Alert tone="danger">{toApiError(mutationError).message}</Alert>}
      </Modal>

      <Modal
        open={dialog === 'rejeter'}
        onClose={close}
        title="Rejeter ce dossier"
        description={
          <>
            {fullName} recevra ce motif et pourra soumettre un nouveau dossier.
          </>
        }
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Annuler
            </Button>
            <Button type="submit" form="reject-form" variant="danger" disabled={reject.isPending}>
              {reject.isPending ? 'Rejet…' : 'Confirmer le rejet'}
            </Button>
          </>
        }
      >
        <form id="reject-form" noValidate onSubmit={onReject} className="flex flex-col gap-3">
          {mutationError && <Alert tone="danger">{toApiError(mutationError).message}</Alert>}
          <TextAreaField
            label="Motif du rejet"
            placeholder="Ex. : photo de la pièce d'identité floue, merci de la reprendre en pleine lumière."
            hint="Soyez précis : le demandeur doit savoir quoi corriger."
            error={errors.motif_rejet?.message}
            {...register('motif_rejet')}
          />
        </form>
      </Modal>
    </Card>
  )
}
