import type { ReactNode } from 'react'
import { Card } from './Card'

type WidgetProps = {
  icon: ReactNode
  title: string
  value: ReactNode
  /** Précision sous la valeur (ex. « sur 1 240 publiés ») */
  hint?: ReactNode
}

// Carte KPI (Widget Horizon).
export function Widget({ icon, title, value, hint }: WidgetProps) {
  return (
    <Card className="flex-row items-center gap-4 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-900 dark:bg-navy-700 dark:text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{title}</p>
        <p className="truncate text-2xl font-bold text-brand-900 dark:text-white">{value}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  )
}
