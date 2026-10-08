import { cn } from '@/utils/cn'
import { PERIODES, type Periode } from '../types'

type PeriodFilterProps = {
  value: Periode
  onChange: (periode: Periode) => void
}

// Sélecteur segmenté, au style du bouton Passager / Conducteur des maquettes.
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div
      role="group"
      aria-label="Période"
      className="inline-flex rounded-2xl border border-line bg-surface p-1 shadow-soft dark:border-white/10 dark:bg-navy-800"
    >
      {(Object.keys(PERIODES) as Periode[]).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={code === value}
          onClick={() => onChange(code)}
          className={cn(
            'rounded-xl px-3 py-2 text-sm font-semibold transition-colors sm:px-4',
            code === value
              ? 'bg-brand-900 text-white dark:bg-accent-500'
              : 'text-muted hover:text-brand-900 dark:hover:text-white',
          )}
        >
          {PERIODES[code]}
        </button>
      ))}
    </div>
  )
}
