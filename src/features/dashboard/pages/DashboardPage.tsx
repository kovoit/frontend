import { useSearchParams } from 'react-router'
import { toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { useDashboardStats } from '../api'
import { EvolutionChart } from '../components/EvolutionChart'
import { KpiGrid } from '../components/KpiGrid'
import { PeriodFilter } from '../components/PeriodFilter'
import { StatusChart } from '../components/StatusChart'
import { TodoCards } from '../components/TodoCards'
import { PERIODES, type Periode } from '../types'

const DEFAULT_PERIODE: Periode = '30j'

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Chargement du tableau de bord" className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[92px]" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[80px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-[400px] xl:col-span-2" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  )
}

function errorTitle(error: unknown): string {
  const { status } = toApiError(error)
  if (status === 403) return 'Accès refusé'
  return 'Impossible de charger le tableau de bord'
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const param = searchParams.get('periode')
  const periode: Periode = param && param in PERIODES ? (param as Periode) : DEFAULT_PERIODE
  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useDashboardStats(periode)

  // La période est dans l'URL : lien partageable, conservée au rechargement.
  const changePeriode = (next: Periode) =>
    setSearchParams(next === DEFAULT_PERIODE ? {} : { periode: next }, { replace: true })

  // Pendant un changement de période, les chiffres affichés sont ceux de l'ancienne période :
  // on l'indique au lieu de présenter des dates qui ne correspondent pas au filtre choisi.
  const actuel = data && !isPlaceholderData ? data : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {actuel
            ? `Du ${formatDate(actuel.periode.debut)} au ${formatDate(actuel.periode.fin)}`
            : `${PERIODES[periode]}${isPending || isPlaceholderData ? ' · chargement…' : ''}`}
        </p>
        <PeriodFilter value={periode} onChange={changePeriode} />
      </div>

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        // Jamais d'anciens chiffres sous une erreur : ils passeraient pour ceux de la période.
        <QueryError title={errorTitle(error)} error={error} onRetry={() => void refetch()} />
      ) : data ? (
        <div
          aria-busy={isPlaceholderData}
          className={cn('flex flex-col gap-6 transition-opacity', isPlaceholderData && 'opacity-50')}
        >
          {data.donnees_demo && (
            <Alert tone="warning">
              La base contient des comptes de démonstration (commandes <code>seed_demo</code> ou{' '}
              <code>seed_backoffice</code>) : les indicateurs ci-dessous incluent leur activité
              fictive.
            </Alert>
          )}
          <KpiGrid indicateurs={data.indicateurs} />
          <TodoCards aTraiter={data.a_traiter} />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <EvolutionChart evolution={data.evolution} />
            </div>
            <StatusChart parStatut={data.reservations_par_statut} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
