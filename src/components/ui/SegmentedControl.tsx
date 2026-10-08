import { cn } from '@/utils/cn'

type Option<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

// Sélecteur segmenté, au style du bouton Passager / Conducteur des maquettes.
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-line bg-surface p-1 shadow-soft dark:border-white/10 dark:bg-navy-800"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors sm:px-4',
            option.value === value
              ? 'bg-brand-900 text-white dark:bg-accent-500'
              : 'text-muted hover:text-brand-900 dark:hover:text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
