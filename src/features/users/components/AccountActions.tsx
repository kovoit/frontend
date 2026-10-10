import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdBlock, MdLockOpen } from 'react-icons/md'
import { z } from 'zod'
import { toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { formatNumber } from '@/utils/format'
import { useReactivateUser, useSuspendUser } from '../api'
import type { UserDetail } from '../types'

// Durées proposées pour une suspension manuelle (la suspension automatique utilise duree_suspension_j).
const DUREE_OPTIONS = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: '', label: "Jusqu'à réactivation manuelle" },
]

const suspendSchema = z.object({
  motif: z.string().trim().min(10, 'Précisez le motif (10 caractères minimum).').max(500, '500 caractères maximum.'),
  duree: z.string(),
})
type SuspendForm = z.infer<typeof suspendSchema>

type AccountActionsProps = {
  user: UserDetail
  onDone: (message: string) => void
}

/** Suspension (motif + durée, confirmée) et réactivation d'un compte (PRD). */
export function AccountActions({ user, onDone }: AccountActionsProps) {
  const [dialog, setDialog] = useState<'suspendre' | 'reactiver' | null>(null)
  const suspend = useSuspendUser(user.id)
  const reactivate = useReactivateUser(user.id)
  const fullName = `${user.prenom} ${user.nom}`

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuspendForm>({
    resolver: zodResolver(suspendSchema),
    defaultValues: { motif: '', duree: '7' },
  })

  const close = () => {
    setDialog(null)
    suspend.reset()
    reactivate.reset()
    reset()
  }

  const onSuspend = handleSubmit(({ motif, duree }) =>
    suspend.mutate(
      { motif, jours: duree ? Number(duree) : null },
      {
        onSuccess: ({ reservations_annulees }) => {
          close()
          onDone(
            reservations_annulees > 0
              ? `Compte suspendu. ${formatNumber(reservations_annulees)} réservation(s) à venir annulée(s) et remboursée(s).`
              : 'Compte suspendu. Aucune réservation à venir à annuler.',
          )
        },
      },
    ),
  )

  return (
    <>
      {user.statut_compte === 'actif' ? (
        <Button variant="danger" onClick={() => setDialog('suspendre')}>
          <MdBlock aria-hidden className="h-4 w-4" />
          Suspendre le compte
        </Button>
      ) : (
        <Button onClick={() => setDialog('reactiver')}>
          <MdLockOpen aria-hidden className="h-4 w-4" />
          Réactiver le compte
        </Button>
      )}

      <Modal
        open={dialog === 'suspendre'}
        onClose={close}
        title={`Suspendre ${fullName}`}
        description="Pendant la suspension, cette personne ne peut ni réserver ni publier de trajet. Ses réservations à venir sont annulées et remboursées."
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Annuler
            </Button>
            <Button type="submit" form="suspend-form" variant="danger" disabled={suspend.isPending}>
              {suspend.isPending ? 'Suspension…' : 'Confirmer la suspension'}
            </Button>
          </>
        }
      >
        <form id="suspend-form" noValidate onSubmit={onSuspend} className="flex flex-col gap-4">
          {suspend.isError && <Alert tone="danger">{toApiError(suspend.error).message}</Alert>}
          <TextAreaField
            label="Motif de la suspension"
            placeholder="Ex. : signalement d'un comportement dangereux pendant un trajet."
            error={errors.motif?.message}
            {...register('motif')}
          />
          <SelectField label="Durée" options={DUREE_OPTIONS} {...register('duree')} />
        </form>
      </Modal>

      <Modal
        open={dialog === 'reactiver'}
        onClose={close}
        title={`Réactiver ${fullName} ?`}
        description="Cette personne pourra de nouveau réserver et, si son KYC conducteur est vérifié, publier des trajets."
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Annuler
            </Button>
            <Button
              disabled={reactivate.isPending}
              onClick={() =>
                reactivate.mutate(undefined, {
                  onSuccess: () => {
                    close()
                    onDone('Compte réactivé.')
                  },
                })
              }
            >
              {reactivate.isPending ? 'Réactivation…' : 'Confirmer la réactivation'}
            </Button>
          </>
        }
      >
        {reactivate.isError && <Alert tone="danger">{toApiError(reactivate.error).message}</Alert>}
      </Modal>
    </>
  )
}
