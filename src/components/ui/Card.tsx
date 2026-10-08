import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// Carte Horizon re-skinnée Nana Tech.
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-card border border-line bg-surface shadow-card dark:border-white/10 dark:bg-navy-800 dark:shadow-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
