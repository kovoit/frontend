import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xl bg-brand-50 dark:bg-white/10', className)}
    />
  )
}
