import type { ReactNode } from 'react'

type Item = { label: string; value: ReactNode }

/** Liste libellé / valeur (fiches de détail). */
export function DescriptionList({ items }: { items: Item[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
