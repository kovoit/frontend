import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { QueryError } from '@/components/ui/QueryError'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { useListParams } from '@/hooks/useListParams'
import { formatNumber } from '@/utils/format'
import { liveStart, useAuditEvents, useAuditLive, useAuditStats } from '../api'
import { AuditFiltersBar } from '../components/AuditFiltersBar'
import { AuditStatsGrid } from '../components/AuditStatsGrid'
import { AuditTable } from '../components/AuditTable'
import { ExportButton } from '../components/ExportButton'
import { LiveIndicator, type LiveState } from '../components/LiveIndicator'
import { AUDIT_FILTER_KEYS, AUDIT_PERIODES, type AuditFilters, type AuditPeriode } from '../types'

const KEYS = [...AUDIT_FILTER_KEYS, 'periode'] as const
const PERIODE_OPTIONS = (Object.keys(AUDIT_PERIODES) as AuditPeriode[]).map((code) => ({
  value: code,
  label: AUDIT_PERIODES[code],
}))

function StatsSection({
  periode,
  onChange,
}: {
  periode: AuditPeriode
  onChange: (p: AuditPeriode) => void
}) {
  const { data, isPending, isError, error, refetch } = useAuditStats(periode)
  return (
    <section aria-labelledby="audit-stats" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="audit-stats" className="text-lg font-bold">
          Vue d’ensemble
        </h2>
        <SegmentedControl
          label="Période des indicateurs"
          options={PERIODE_OPTIONS}
          value={periode}
          onChange={onChange}
        />
      </div>
      {isPending ? (
        <Skeleton className="h-[200px]" />
      ) : isError ? (
        <QueryError
          title="Indicateurs indisponibles"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <AuditStatsGrid stats={data} />
      )}
    </section>
  )
}

export function AuditPage() {
  const { values, page, setFilters, setPage } = useListParams(KEYS)
  const periode: AuditPeriode =
    values.periode in AUDIT_PERIODES ? (values.periode as AuditPeriode) : '7j'
  // React Query compare les clés par contenu : un nouvel objet à chaque rendu suffit
  const filters: AuditFilters = Object.fromEntries(
    AUDIT_FILTER_KEYS.map((key) => [key, values[key]]),
  ) as AuditFilters

  const list = useAuditEvents(filters, page)
  const newest = list.data?.results[0]
  const live = useAuditLive(
    filters,
    liveStart(newest, list.dataUpdatedAt),
    page === 1 && list.isSuccess,
  )

  const listIds = new Set(list.data?.results.map((event) => event.id))
  const liveEvents = (live.data?.events ?? []).filter((event) => !listIds.has(event.id))
  const shown =
    page === 1 ? [...liveEvents, ...(list.data?.results ?? [])] : (list.data?.results ?? [])
  const state: LiveState = page > 1 ? 'paused' : live.isError ? 'reconnecting' : 'live'

  return (
    <div className="flex flex-col gap-6">
      <StatsSection
        periode={periode}
        onChange={(next) => setFilters({ periode: next === '7j' ? '' : next })}
      />

      <section aria-labelledby="audit-journal" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="audit-journal" className="text-lg font-bold">
            Fil d’activité
          </h2>
          <LiveIndicator
            state={state}
            lastUpdate={live.dataUpdatedAt}
            reason="le direct ne s’applique qu’à la première page"
          />
        </div>
        <AuditFiltersBar filters={filters} onChange={setFilters} />
        <div className="flex justify-end">
          <ExportButton filters={filters} />
        </div>

        {live.data?.tronque && (
          <Alert tone="warning">
            <span className="flex flex-wrap items-center gap-3">
              Trop d’événements reçus d’un coup pour le direct.
              <Button variant="secondary" onClick={live.reset}>
                Recharger la liste
              </Button>
            </span>
          </Alert>
        )}
        {liveEvents.length > 0 && (
          <p className="text-sm text-muted" aria-live="polite">
            {formatNumber(liveEvents.length)} nouvel(s) événement(s) reçu(s) en direct, en tête de
            liste.
          </p>
        )}

        {list.isPending ? (
          <Skeleton className="h-[420px]" />
        ) : list.isError ? (
          <QueryError
            title="Journal indisponible"
            error={list.error}
            onRetry={() => void list.refetch()}
          />
        ) : (
          <>
            <AuditTable
              events={shown}
              isFetching={list.isFetching}
              emptyMessage="Aucun événement enregistré pour ces critères."
            />
            <Pagination page={page} count={list.data.count} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  )
}
