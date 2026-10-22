import type { ReactNode } from 'react'
import { MdInsights } from 'react-icons/md'

/** Zone de graphique sans activité : un vrai résultat vide, pas une erreur de chargement. */
export function EmptyChart({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line text-center dark:border-white/10">
      <MdInsights aria-hidden className="h-7 w-7 text-muted" />
      <p className="text-sm text-muted">{children}</p>
    </div>
  )
}
