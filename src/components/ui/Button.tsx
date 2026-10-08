import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-900 text-white hover:bg-brand-700 dark:bg-accent-500 dark:hover:bg-accent-600',
  secondary:
    'border border-line bg-surface text-brand-900 hover:bg-brand-50 dark:border-white/10 dark:bg-navy-800 dark:text-white',
  danger: 'bg-danger-500 text-white hover:bg-danger-600',
  ghost: 'text-brand-900 hover:bg-brand-50 dark:text-white dark:hover:bg-white/10',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  )
}
