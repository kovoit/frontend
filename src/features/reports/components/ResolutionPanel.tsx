import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { MdCheck, MdGavel } from 'react-icons/md'
import { z } from 'zod'
import { toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { cn } from '@/utils/cn'
import { formatFcfa } from '@/utils/format'
import { useArbitrateDispute, useResolveReport } from '../api'
import type { SignalementDetail } from '../types'

const resolution = z
  .string()
  .trim()
  .min(10, 'Décrivez la résolution (10 caractères minimum).')
  .max(1000, '1 000 caractères maximum.')

const resolveSchema = z.object({ resolution })
const arbitrateSchema = z.object({
  decision: z.enum(['conducteur', 'passager'], { error: 'Choisissez en faveur de qui trancher.' }),
  resolution,
})
type ResolveForm = z.infer<typeof resolveSchema>
type ArbitrateForm = z.infer<typeof arbitrateSchema>

function ResolveDialog({ signalement, onClose }: { signalement: SignalementDetail; onClose: () => void }) {
  const mutation = useResolveReport(signalement.id)
  const { register, handleSubmit, formState: { errors } } = useForm<ResolveForm>({
    resolver: zodResolver(resolveSchema),
  })
  return (
    <Modal
      open
      onClose={onClose}
      title="Marquer comme traité"
      description="La résolution est conservée dans l'historique du signalement."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="resolve-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Confirmer'}
          </Button>
        </>
      }
    >
      <form
        id="resolve-form"
        noValidate
        className="flex flex-col gap-3"
        onSubmit={handleSubmit((values) => mutation.mutate(values, { onSuccess: onClose }))}
      >
        {mutation.isError && <Alert tone="danger">{toApiError(mutation.error).message}</Alert>}
        <TextAreaField
          label="Résolution"
          placeholder="Ex. : conducteur contacté et averti ; aucune récidive à ce jour."
          error={errors.resolution?.message}
          {...register('resolution')}
        />
      </form>
    </Modal>
  )
}

function ArbitrateDialog({ signalement, onClose }: { signalement: SignalementDetail; onClose: () => void }) {
  const mutation = useArbitrateDispute(signalement.id)
  const { register, handleSubmit, control, formState: { errors } } = useForm<ArbitrateForm>({
    resolver: zodResolver(arbitrateSchema),
  })
  const decision = useWatch({ control, name: 'decision' })
  const { passager, conducteur, prix } = signalement.reservation
  const options = [
    {
      value: 'conducteur' as const,
      title: `En faveur du conducteur (${conducteur.prenom} ${conducteur.nom})`,
      detail: `Le trajet est dû : avec le portefeuille, les ${formatFcfa(prix)} gelés sont versés au conducteur.`,
    },
    {
      value: 'passager' as const,
      title: `En faveur du passager (${passager.prenom} ${passager.nom})`,
      detail: `Avec le portefeuille, les ${formatFcfa(prix)} gelés sont remboursés au passager.`,
    },
  ]

  return (
    <Modal
      open
      onClose={onClose}
      title="Trancher le litige"
      description="La réservation passera au statut « Clôturée ». Cette décision est définitive."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="arbitrate-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Confirmer la décision'}
          </Button>
        </>
      }
    >
      <form
        id="arbitrate-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values, { onSuccess: onClose }))}
      >
        {mutation.isError && <Alert tone="danger">{toApiError(mutation.error).message}</Alert>}
        <fieldset aria-describedby={errors.decision ? 'decision-error' : undefined}>
          <legend className="mb-2 text-sm font-semibold">Décision</legend>
          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors',
                  decision === option.value
                    ? 'border-brand-700 bg-brand-50 dark:border-white/40 dark:bg-white/10'
                    : 'border-line hover:bg-bg dark:border-white/10 dark:hover:bg-white/5',
                )}
              >
                <input type="radio" value={option.value} className="mt-1 accent-brand-900" {...register('decision')} />
                <span>
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="block text-xs text-muted">{option.detail}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.decision && (
            <p id="decision-error" className="mt-1.5 text-xs font-medium text-danger-600">
              {errors.decision.message}
            </p>
          )}
        </fieldset>
        <TextAreaField
          label="Justification"
          placeholder="Ex. : le GPS du conducteur confirme l'arrêt à 2 km de la destination."
          error={errors.resolution?.message}
          {...register('resolution')}
        />
      </form>
    </Modal>
  )
}

/** Actions sur un signalement ouvert : traitement simple, ou arbitrage si la réservation est en litige. */
export function ResolutionPanel({ signalement }: { signalement: SignalementDetail }) {
  const [open, setOpen] = useState(false)
  const isDispute = signalement.reservation.statut === 'litige'

  return (
    <Card className="gap-4 p-5">
      <div>
        <h2 className="text-lg font-bold">{isDispute ? 'Arbitrage' : 'Traitement'}</h2>
        <p className="mt-1 text-sm text-muted">
          {isDispute
            ? 'La réservation est en litige : le montant est gelé jusqu’à votre décision.'
            : 'Contactez les personnes concernées si besoin, puis consignez la résolution.'}
        </p>
      </div>
      <Button className="w-fit" onClick={() => setOpen(true)}>
        {isDispute ? <MdGavel aria-hidden className="h-4 w-4" /> : <MdCheck aria-hidden className="h-4 w-4" />}
        {isDispute ? 'Trancher le litige' : 'Marquer comme traité'}
      </Button>
      {open &&
        (isDispute ? (
          <ArbitrateDialog signalement={signalement} onClose={() => setOpen(false)} />
        ) : (
          <ResolveDialog signalement={signalement} onClose={() => setOpen(false)} />
        ))}
    </Card>
  )
}
