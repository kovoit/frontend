import { useMemo } from 'react'
import { Link } from 'react-router'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { QueryError } from '@/components/ui/QueryError'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useListParams } from '@/hooks/useListParams'
import { formatDate, formatPercent } from '@/utils/format'
import { useUserList } from '../api'
import type { UserListItem } from '../types'

const STATUT_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'actif', label: 'Actifs' },
  { value: 'suspendu', label: 'Suspendus' },
] as const
type StatutFilter = (typeof STATUT_OPTIONS)[number]['value']

const COLUMNS: Column<UserListItem>[] = [
  {
    id: 'utilisateur',
    header: 'Utilisateur',
    cell: (user) => (
      <Link
        to={`/admin/users/${user.id}`}
        className="group block min-w-0 rounded-lg"
      >
        <span className="block font-semibold group-hover:underline">
          {user.prenom} {user.nom}
        </span>
        <span className="block truncate text-xs text-muted">{user.email}</span>
      </Link>
    ),
  },
  { id: 'telephone', header: 'Téléphone', cell: (user) => user.telephone, className: 'whitespace-nowrap' },
  {
    id: 'kyc_passager',
    header: 'KYC passager',
    cell: (user) => <StatusBadge domain="kyc" value={user.kyc_passager} />,
  },
  {
    id: 'kyc_conducteur',
    header: 'KYC conducteur',
    cell: (user) => <StatusBadge domain="kyc" value={user.kyc_conducteur} />,
  },
  {
    id: 'fiabilite',
    header: 'Fiabilité',
    className: 'text-right tabular-nums',
    cell: (user) =>
      user.fiabilite === null ? (
        <span className="text-muted" title="Aucune réservation sur 30 jours">
          —
        </span>
      ) : (
        formatPercent(user.fiabilite)
      ),
  },
  {
    id: 'compte',
    header: 'Compte',
    cell: (user) => <StatusBadge domain="compte" value={user.statut_compte} />,
  },
  {
    id: 'inscrit',
    header: 'Inscrit le',
    cell: (user) => formatDate(user.cree_le),
    className: 'whitespace-nowrap',
  },
]

export function UsersListPage() {
  const { values, page, setFilters, setPage } = useListParams(['statut_compte', 'q'] as const)
  const statut: StatutFilter = STATUT_OPTIONS.some((o) => o.value === values.statut_compte)
    ? (values.statut_compte as StatutFilter)
    : ''

  const filters = useMemo(
    () => ({ search: values.q, statut_compte: statut, page }),
    [values.q, statut, page],
  )
  const { data, isPending, isError, error, refetch, isFetching } = useUserList(filters)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          label="Statut du compte"
          options={[...STATUT_OPTIONS]}
          value={statut}
          onChange={(value) => setFilters({ statut_compte: value })}
        />
        <div className="flex lg:w-[420px]">
          <SearchInput
            label="Rechercher un utilisateur"
            placeholder="Nom, email ou téléphone"
            value={values.q}
            onChange={(q) => setFilters({ q })}
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
            caption="Utilisateurs"
            columns={COLUMNS}
            data={data.results}
            getRowId={(user) => String(user.id)}
            isFetching={isFetching}
            emptyMessage="Aucun utilisateur ne correspond à ces critères."
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  )
}
