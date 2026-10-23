import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import { MOYEN_PAIEMENT } from '@/config/enums'
import { formatFcfa } from '@/utils/format'
import { useRefuserRetrait, useVerserRetrait } from '../api'
import type { TransactionAdmin } from '../types'

const verserSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(3, 'Saisissez la référence du transfert (3 caractères minimum).')
    .max(64),
})
const refuserSchema = z.object({
  motif: z.string().trim().min(3, 'Indiquez le motif du refus (3 caractères minimum).').max(255),
})

type DialogProps = { retrait: TransactionAdmin; onClose: () => void }

function resume({ montant, moyen_paiement, telephone, utilisateur }: TransactionAdmin) {
  const moyen = moyen_paiement ? MOYEN_PAIEMENT[moyen_paiement] : 'Mobile Money'
  return `${formatFcfa(montant)} sur le ${moyen} ${telephone} de ${utilisateur.prenom} ${utilisateur.nom}.`
}

export function VerserDialog({ retrait, onClose }: DialogProps) {
  const mutation = useVerserRetrait()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof verserSchema>>({
    resolver: zodResolver(verserSchema),
  })
  return (
    <Modal
      open
      onClose={onClose}
      title="Confirmer le versement"
      description={`Envoyez d'abord ${resume(retrait)} Puis saisissez la référence du transfert.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="verser-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Retrait versé'}
          </Button>
        </>
      }
    >
      <form
        id="verser-form"
        noValidate
        className="flex flex-col gap-3"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({ id: retrait.id, ...values }, { onSuccess: onClose }),
        )}
      >
        {mutation.isError && <Alert tone="danger">{toApiError(mutation.error).message}</Alert>}
        <TextField
          label="Référence du transfert"
          placeholder="Ex. : référence du SMS Flooz / Mixx"
          error={errors.reference?.message}
          {...register('reference')}
        />
      </form>
    </Modal>
  )
}

export function RefuserDialog({ retrait, onClose }: DialogProps) {
  const mutation = useRefuserRetrait()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof refuserSchema>>({
    resolver: zodResolver(refuserSchema),
  })
  return (
    <Modal
      open
      onClose={onClose}
      title="Refuser le retrait"
      description={`${resume(retrait)} Le montant redeviendra disponible sur son portefeuille.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" type="submit" form="refuser-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Refuser le retrait'}
          </Button>
        </>
      }
    >
      <form
        id="refuser-form"
        noValidate
        className="flex flex-col gap-3"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({ id: retrait.id, ...values }, { onSuccess: onClose }),
        )}
      >
        {mutation.isError && <Alert tone="danger">{toApiError(mutation.error).message}</Alert>}
        <TextAreaField
          label="Motif"
          placeholder="Ex. : numéro Mixx invalide, à corriger dans le profil."
          error={errors.motif?.message}
          {...register('motif')}
        />
      </form>
    </Modal>
  )
}
