import { useMemo } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { QueryError } from '@/components/ui/QueryError'
import { SearchInput } from '@/components/ui/SearchInput'
import { SelectField } from '@/components/ui/SelectField'
import { Skeleton } from '@/components/ui/Skeleton'
import { RESERVATION_STATUS, type ReservationStatus } from '@/config/enums'
import { useListParams } from '@/hooks/useListParams'
import { useBookingList } from '../api'
import {
  bookingActionColumn,
  bookingDepartureColumn,
  bookingDriverColumn,
  bookingIdColumn,
  bookingPassengerColumn,
  bookingPriceColumn,
  bookingRouteColumn,
  bookingStatusColumn,
} from '../components/bookingColumns'

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  ...(Object.keys(RESERVATION_STATUS) as ReservationStatus[]).map((value) => ({
    value,
    label: RESERVATION_STATUS[value].label,
  })),
]

const COLUMNS = [
  bookingIdColumn,
  bookingPassengerColumn,
  bookingDriverColumn,
  bookingRouteColumn,
  bookingDepartureColumn,
  bookingPriceColumn,
  bookingStatusColumn,
  bookingActionColumn,
]

export function BookingsListPage() {
  const { values, page, setFilters, setPage } = useListParams(['statut', 'q'] as const)
  const statut = values.statut in RESERVATION_STATUS ? values.statut : ''
  const filters = useMemo(() => ({ statut, search: values.q, page }), [statut, values.q, page])
  const { data, isPending, isError, error, refetch, isFetching } = useBookingList(filters)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          label="Rechercher une réservation"
          placeholder="Passager, conducteur ou n° de réservation"
          value={values.q}
          onChange={(q) => setFilters({ q })}
        />
        <SelectField
          label="Statut de la réservation"
          hideLabel
          className="md:w-52"
          options={STATUT_OPTIONS}
          value={statut}
          onChange={(event) => setFilters({ statut: event.target.value })}
        />
      </div>

      {isPending ? (
        <Skeleton className="h-[420px]" />
      ) : isError && !data ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : data ? (
        <>
          <DataTable
            caption="Réservations"
            columns={COLUMNS}
            data={data.results}
            getRowId={(res) => String(res.id)}
            isFetching={isFetching}
            emptyMessage={
              statut === 'litige' && !values.q
                ? 'Aucun litige en cours.'
                : 'Aucune réservation ne correspond à ces critères.'
            }
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  )
}
