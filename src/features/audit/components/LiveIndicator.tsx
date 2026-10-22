import { cn } from '@/utils/cn'

export type LiveState = 'live' | 'reconnecting' | 'paused'

const STATES: Record<LiveState, { label: string; dot: string }> = {
  live: { label: 'En direct', dot: 'bg-success-500 animate-pulse' },
  reconnecting: { label: 'Connexion interrompue, nouvelle tentative…', dot: 'bg-danger-500' },
  paused: { label: 'Direct en pause', dot: 'bg-muted' },
}

type LiveIndicatorProps = { state: LiveState; lastUpdate: number; reason?: string }

/** État du flux temps réel, annoncé aux lecteurs d'écran quand il change. */
export function LiveIndicator({ state, lastUpdate, reason }: LiveIndicatorProps) {
  const time =
    lastUpdate > 0
      ? new Intl.DateTimeFormat('fr-FR', { timeStyle: 'medium', timeZone: 'Africa/Lome' }).format(
          lastUpdate,
        )
      : null
  return (
    // Seul l'état est annoncé (pas l'heure, qui change toutes les 5 s)
    <p className="inline-flex flex-wrap items-center gap-2 text-sm text-muted">
      <span aria-hidden className={cn('h-2 w-2 rounded-full', STATES[state].dot)} />
      <span role="status" className="font-semibold text-brand-900 dark:text-white">
        {STATES[state].label}
      </span>
      {state === 'paused' && reason ? <span>· {reason}</span> : null}
      {state !== 'paused' && time ? <span>· vérifié à {time}</span> : null}
    </p>
  )
}
