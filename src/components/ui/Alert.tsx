import type { ReactNode } from 'react'
import { MdCheckCircle, MdErrorOutline, MdInfoOutline, MdWarningAmber } from 'react-icons/md'
import { cn } from '@/utils/cn'

type AlertTone = 'success' | 'danger' | 'warning' | 'info'

const TONES: Record<AlertTone, { classes: string; icon: ReactNode }> = {
  success: {
    classes: 'bg-success-50 text-success-700 dark:bg-success-700/30 dark:text-success-100',
    icon: <MdCheckCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />,
  },
  danger: {
    classes: 'bg-danger-50 text-danger-700 dark:bg-danger-700/30 dark:text-danger-100',
    icon: <MdErrorOutline aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />,
  },
  warning: {
    classes: 'bg-accent-50 text-accent-700 dark:bg-accent-700/30 dark:text-accent-200',
    icon: <MdWarningAmber aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />,
  },
  info: {
    classes: 'bg-brand-50 text-brand-700 dark:bg-white/10 dark:text-white',
    icon: <MdInfoOutline aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />,
  },
}

type AlertProps = {
  tone: AlertTone
  children: ReactNode
  className?: string
}

/** Bandeau de message. Les erreurs et succès sont annoncés aux lecteurs d'écran. */
export function Alert({ tone, children, className }: AlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium',
        TONES[tone].classes,
        className,
      )}
    >
      {TONES[tone].icon}
      <div className="min-w-0">{children}</div>
    </div>
  )
}
