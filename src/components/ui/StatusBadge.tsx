import { STATUS_DOMAINS, type StatusDomain, type StatusValue, type Tone } from '@/config/enums'
import { cn } from '@/utils/cn'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-brand-50 text-brand-700 dark:bg-white/10 dark:text-white',
  info: 'bg-brand-100 text-brand-900 dark:bg-brand-700/40 dark:text-white',
  warning: 'bg-accent-50 text-accent-700 dark:bg-accent-700/30 dark:text-accent-200',
  success: 'bg-success-50 text-success-700 dark:bg-success-700/30 dark:text-success-100',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-700/30 dark:text-danger-100',
}

const DOT_CLASSES: Record<Tone, string> = {
  neutral: 'bg-muted',
  info: 'bg-brand-600',
  warning: 'bg-accent-500',
  success: 'bg-success-500',
  danger: 'bg-danger-500',
}

type StatusBadgeProps<D extends StatusDomain> = {
  domain: D
  value: StatusValue<D>
}

export function StatusBadge<D extends StatusDomain>({ domain, value }: StatusBadgeProps<D>) {
  const meta = (STATUS_DOMAINS[domain] as Record<string, { label: string; tone: Tone }>)[
    value as string
  ]
  const label = meta?.label ?? String(value)
  const tone = meta?.tone ?? 'neutral'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        TONE_CLASSES[tone],
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[tone])} />
      {label}
    </span>
  )
}
