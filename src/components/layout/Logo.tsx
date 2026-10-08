import { cn } from '@/utils/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-xl shadow-soft" />
      <div className="leading-tight">
        <p className="text-xl font-extrabold text-brand-900 dark:text-white">
          Kovo<span className="text-accent-500">ï</span>t
        </p>
        <p className="text-[11px] font-medium text-muted">Administration</p>
      </div>
    </div>
  )
}
