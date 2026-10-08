import { MdConstruction } from 'react-icons/md'
import { Card } from './Card'

type ComingSoonProps = {
  title: string
  description: string
  phase: number
}

// Écran temporaire des pages non encore implémentées (voir plan par phases).
export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <Card className="items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
        <MdConstruction className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="max-w-md text-sm text-muted">{description}</p>
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-white/10 dark:text-white">
        Prévu en phase {phase}
      </span>
    </Card>
  )
}
