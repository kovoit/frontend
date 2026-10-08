import type { ReactNode } from 'react'
import { Card } from './Card'

type WidgetProps = {
  icon: ReactNode
  title: string
  value: ReactNode
}

// Carte KPI (Widget Horizon).
export function Widget({ icon, title, value }: WidgetProps) {
  return (
    <Card className="flex-row items-center gap-4 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-900 dark:bg-navy-700 dark:text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{title}</p>
        <p className="truncate text-xl font-bold text-brand-900 dark:text-white">{value}</p>
      </div>
    </Card>
  )
}
