import { useMemo } from 'react'
import { MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { QueryError } from '@/components/ui/QueryError'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useListParams } from '@/hooks/useListParams'
import { formatDateTime, shortId } from '@/utils/format'
import { useReportList } from '../api'
import type { SignalementListItem } from '../types'

// Par défaut : la file des signalements ouverts, les plus anciens d'abord.
const STATUT_OPTIONS = [
  { value: 'ouvert', label: 'Ouverts' },
  { value: 'traite', label: 'Traités' },
  { value: 'tous', label: 'Tous' },
] as const
type StatutFilter = (typeof STATUT_OPTIONS)[number]['value']

const COLUMNS: Column<SignalementListItem>[] = [
  {
    id: 'cree_le',
    header: 'Signalé le',
    cell: (s) => formatDateTime(s.cree_le),
    className: 'whitespace-nowrap',
  },
  {
    id: 'parties',
    header: 'Auteur → personne visée',
    cell: (s) => (
      <span className="whitespace-nowrap">
        {s.auteur.prenom} {s.auteur.nom} <span className="text-muted">→</span> {s.cible.prenom}{' '}
        {s.cible.nom}
      </span>
    ),
  },
  {
    id: 'motif',
    header: 'Motif',
    cell: (s) => <span className="line-clamp-2 block max-w-[320px]">{s.motif}</span>,
  },
  {
    id: 'reservation',
    header: 'Réservation',
    cell: (s) => (
      <span className="flex flex-wrap items-center gap-2">
        <span className="tabular-nums">#{shortId(s.reservation.id)}</span>
        <StatusBadge domain="reservation" value={s.reservation.statut} />
      </span>
    ),
  },
  { id: 'statut', header: 'Statut', cell: (s) => <StatusBadge domain="signalement" value={s.statut} /> },
  {
    id: 'action',
    header: 'Action',
    className: 'text-right',
    cell: (s) => {
      const label =
        s.statut === 'traite' ? 'Voir' : s.reservation.statut === 'litige' ? 'Trancher' : 'Traiter'
      return (
        <Link
          to={`/admin/reports/${s.id}`}
          aria-label={`${label} le signalement de ${s.auteur.prenom} ${s.auteur.nom}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-white/10"
        >
          {label}
          <MdChevronRight aria-hidden className="h-4 w-4" />
        </Link>
      )
    },
  },
]

export function ReportsListPage() {
  const { values, page, setFilters, setPage } = useListParams(['statut'] as const)
  const statut: StatutFilter = STATUT_OPTIONS.some((o) => o.value === values.statut)
    ? (values.statut as StatutFilter)
    : 'ouvert'
  const filters = useMemo(() => ({ statut: statut === 'tous' ? '' : statut, page }), [statut, page])
  const { data, isPending, isError, error, refetch, isFetching } = useReportList(filters)

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl
        label="Statut des signalements"
        options={[...STATUT_OPTIONS]}
        value={statut}
        onChange={(value) => setFilters({ statut: value === 'ouvert' ? '' : value })}
      />

      {isPending ? (
        <Skeleton className="h-[420px]" />
      ) : isError && !data ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : data ? (
        <>
          <DataTable
            caption="Signalements"
            columns={COLUMNS}
            data={data.results}
            getRowId={(s) => String(s.id)}
            isFetching={isFetching}
            emptyMessage={statut === 'ouvert' ? 'Aucun signalement ouvert. Tout est traité.' : 'Aucun signalement.'}
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  )
}
