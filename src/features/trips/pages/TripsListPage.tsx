import { useId, useMemo } from 'react'
import { MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { QueryError } from '@/components/ui/QueryError'
import { SearchInput } from '@/components/ui/SearchInput'
import { SelectField } from '@/components/ui/SelectField'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TRAJET_STATUS, type TrajetStatus } from '@/config/enums'
import { useListParams } from '@/hooks/useListParams'
import { formatDateTime, formatFcfa, formatKm } from '@/utils/format'
import { useTripList } from '../api'
import type { TrajetListItem } from '../types'

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  ...(Object.keys(TRAJET_STATUS) as TrajetStatus[]).map((value) => ({
    value,
    label: TRAJET_STATUS[value].label,
  })),
]

const COLUMNS: Column<TrajetListItem>[] = [
  {
    id: 'depart_le',
    header: 'Départ',
    cell: (trajet) => formatDateTime(trajet.depart_le),
    className: 'whitespace-nowrap',
  },
  {
    id: 'itineraire',
    header: 'Itinéraire',
    cell: (trajet) => (
      <span className="block max-w-[280px]">
        {trajet.depart.libelle} <span className="text-muted">→</span> {trajet.arrivee.libelle}
      </span>
    ),
  },
  {
    id: 'conducteur',
    header: 'Conducteur',
    cell: (trajet) => (
      <Link to={`/admin/users/${trajet.conducteur.id}`} className="font-semibold hover:underline">
        {trajet.conducteur.prenom} {trajet.conducteur.nom}
      </Link>
    ),
  },
  {
    id: 'places',
    header: 'Places libres',
    cell: (trajet) => `${trajet.places_restantes} / ${trajet.places_total}`,
    className: 'text-right tabular-nums',
  },
  {
    id: 'distance',
    header: 'Distance',
    cell: (trajet) => formatKm(trajet.distance_km),
    className: 'whitespace-nowrap text-right tabular-nums',
  },
  {
    id: 'prix',
    header: 'Prix / place',
    cell: (trajet) => formatFcfa(trajet.prix_place),
    className: 'whitespace-nowrap text-right tabular-nums',
  },
  { id: 'statut', header: 'Statut', cell: (trajet) => <StatusBadge domain="trajet" value={trajet.statut} /> },
  {
    id: 'action',
    header: 'Action',
    className: 'text-right',
    cell: (trajet) => (
      <Link
        to={`/admin/trips/${trajet.id}`}
        aria-label={`Voir le trajet ${trajet.depart.libelle} vers ${trajet.arrivee.libelle}`}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-white/10"
      >
        Voir
        <MdChevronRight aria-hidden className="h-4 w-4" />
      </Link>
    ),
  },
]

export function TripsListPage() {
  const dateId = useId()
  const { values, page, setFilters, setPage } = useListParams(['statut', 'q', 'date'] as const)
  const statut = values.statut in TRAJET_STATUS ? values.statut : ''
  const filters = useMemo(
    () => ({ statut, search: values.q, date: values.date, page }),
    [statut, values.q, values.date, page],
  )
  const { data, isPending, isError, error, refetch, isFetching } = useTripList(filters)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          label="Rechercher un trajet"
          placeholder="Conducteur ou lieu (ex. Adidogomé)"
          value={values.q}
          onChange={(q) => setFilters({ q })}
        />
        <SelectField
          label="Statut du trajet"
          hideLabel
          className="md:w-48"
          options={STATUT_OPTIONS}
          value={statut}
          onChange={(event) => setFilters({ statut: event.target.value })}
        />
        <div className="md:w-44">
          <label htmlFor={dateId} className="sr-only">
            Date de départ
          </label>
          <input
            id={dateId}
            type="date"
            value={values.date}
            onChange={(event) => setFilters({ date: event.target.value })}
            className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-0 dark:border-white/10 dark:bg-navy-800 dark:text-white"
          />
        </div>
      </div>

      {isPending ? (
        <Skeleton className="h-[420px]" />
      ) : isError && !data ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : data ? (
        <>
          <DataTable
            caption="Trajets"
            columns={COLUMNS}
            data={data.results}
            getRowId={(trajet) => String(trajet.id)}
            isFetching={isFetching}
            emptyMessage="Aucun trajet ne correspond à ces critères."
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  )
}
