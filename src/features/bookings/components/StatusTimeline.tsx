import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { ReservationDetail } from '../types'

const DESCRIPTIONS: Partial<Record<ReservationDetail['statut'], string>> = {
  demandee: 'Le passager a demandé une place.',
  acceptee: 'Le conducteur a accepté ; le code de départ a été généré pour le passager.',
  refusee: 'Le conducteur a refusé la demande.',
  annulee: 'Réservation annulée avant le départ.',
  absent: 'Le conducteur a déclaré le passager absent au point de prise en charge.',
  en_cours: 'Code de départ validé : le passager est monté.',
  terminee: 'Le conducteur a clôturé le trajet.',
  litige: 'Un problème a été signalé : montant gelé, arbitrage requis.',
  cloturee: 'Réservation clôturée.',
}

/** Chronologie des statuts de la réservation (horodatages fournis par l'API). */
export function StatusTimeline({ historique }: { historique: ReservationDetail['historique'] }) {
  return (
    <ol aria-label="Historique des statuts" className="flex flex-col">
      {historique.map((step, index) => {
        const last = index === historique.length - 1
        return (
          <li key={`${step.statut}-${step.le}`} className="relative flex gap-4 pb-5 last:pb-0">
            {!last && (
              <span aria-hidden className="absolute left-[5px] top-4 h-full w-0.5 bg-line dark:bg-white/10" />
            )}
            <span
              aria-hidden
              className={
                last
                  ? 'relative mt-1.5 h-3 w-3 shrink-0 rounded-full bg-accent-500 ring-4 ring-accent-50 dark:ring-accent-700/30'
                  : 'relative mt-1.5 h-3 w-3 shrink-0 rounded-full bg-brand-300'
              }
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge domain="reservation" value={step.statut} />
                <time dateTime={step.le} className="text-xs text-muted">
                  {formatDateTime(step.le)}
                </time>
              </div>
              {DESCRIPTIONS[step.statut] && (
                <p className="mt-1 text-sm text-muted">{DESCRIPTIONS[step.statut]}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
