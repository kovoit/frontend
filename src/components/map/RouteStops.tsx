import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import type { MapStop } from './RouteMap'

// Leaflet (~150 ko) n'est chargé que sur les pages qui affichent une carte.
const RouteMap = lazy(() => import('./RouteMap'))

const KIND_LABEL: Record<MapStop['kind'], string> = {
  depart: 'Départ',
  point: 'Prise en charge',
  arrivee: 'Arrivée',
}

const DOT: Record<MapStop['kind'], string> = {
  depart: 'bg-chart-1',
  point: 'bg-chart-2',
  arrivee: 'bg-brand-900 dark:bg-white',
}

/** Carte + liste ordonnée des arrêts (la liste porte l'information, la carte l'illustre). */
export function RouteStops({ stops }: { stops: MapStop[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="h-[280px] overflow-hidden rounded-2xl border border-line dark:border-white/10 lg:col-span-3">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <RouteMap stops={stops} />
        </Suspense>
      </div>
      <ol aria-label="Arrêts du trajet" className="flex flex-col gap-0 lg:col-span-2">
        {stops.map((stop, index) => (
          <li key={stop.key} className="relative flex gap-3 pb-4 last:pb-0">
            {index < stops.length - 1 && (
              <span aria-hidden className="absolute left-[7px] top-5 h-full w-0.5 bg-line dark:bg-white/10" />
            )}
            <span
              aria-hidden
              className={cn('relative mt-1 h-4 w-4 shrink-0 rounded-full ring-2 ring-surface dark:ring-navy-800', DOT[stop.kind])}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {KIND_LABEL[stop.kind]}
              </p>
              <p className="text-sm font-medium">{stop.label}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
