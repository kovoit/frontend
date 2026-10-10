import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useUpdateParametre } from '../api'
import type { Parametre } from '../types'
import { formatValeur } from '../valeur'

/** Règles du backend (type, minimum) rejouées côté front pour un retour immédiat. */
function schemaPour(parametre: Parametre) {
  let valeur = z.number({ error: 'Saisissez un nombre.' })
  if (parametre.type_valeur === 'entier') valeur = valeur.int('Saisissez un nombre entier.')
  valeur = valeur.min(parametre.minimum, `Minimum : ${formatValeur(parametre, parametre.minimum)}.`)
  return z.object({ valeur })
}

type EditForm = { valeur: number }

type EditParametreDialogProps = {
  parametre: Parametre
  onClose: () => void
  onSaved: (parametre: Parametre) => void
}

export function EditParametreDialog({ parametre, onClose, onSaved }: EditParametreDialogProps) {
  const mutation = useUpdateParametre(parametre.cle)
  const schema = useMemo(() => schemaPour(parametre), [parametre])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(schema),
    defaultValues: { valeur: parametre.valeur },
  })

  const onSubmit = handleSubmit(({ valeur }) =>
    mutation.mutate(valeur, {
      onSuccess: onSaved,
      onError: (error) => {
        const message = toApiError(error).fieldErrors.valeur?.[0]
        if (message) setError('valeur', { message })
      },
    }),
  )
  const erreurGenerale = mutation.isError && !errors.valeur ? mutation.error : null

  return (
    <Modal
      open
      onClose={onClose}
      title="Modifier le paramètre"
      description={parametre.description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="parametre-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <form id="parametre-form" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {erreurGenerale && <Alert tone="danger">{toApiError(erreurGenerale).message}</Alert>}
        <p className="text-sm text-muted">
          Valeur actuelle : <strong>{formatValeur(parametre)}</strong>. La nouvelle valeur
          s'applique immédiatement à toute l'application.
        </p>
        <TextField
          label={`Nouvelle valeur${parametre.unite ? ` (${parametre.unite})` : ''}`}
          type="number"
          inputMode={parametre.type_valeur === 'entier' ? 'numeric' : 'decimal'}
          step={parametre.type_valeur === 'entier' ? 1 : 0.1}
          min={parametre.minimum}
          error={errors.valeur?.message}
          {...register('valeur', { valueAsNumber: true })}
        />
      </form>
    </Modal>
  )
}
