import { useMemo } from 'react'
import { MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { QueryError } from '@/components/ui/QueryError'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SelectField } from '@/components/ui/SelectField'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KYC_TYPE } from '@/config/enums'
import { useListParams } from '@/hooks/useListParams'
import { formatDateTime } from '@/utils/format'
import { useKycList } from '../api'
import type { KycDossierListItem } from '../types'

// Par défaut la file de travail : dossiers en attente, les plus anciens d'abord.
const STATUT_OPTIONS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'verifie', label: 'Vérifiés' },
  { value: 'rejete', label: 'Rejetés' },
  { value: 'tous', label: 'Tous' },
] as const
type StatutFilter = (typeof STATUT_OPTIONS)[number]['value']

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'passager', label: 'Passager' },
  { value: 'conducteur', label: 'Conducteur' },
]

const COLUMNS: Column<KycDossierListItem>[] = [
  {
    id: 'demandeur',
    header: 'Demandeur',
    cell: (dossier) => (
      <div className="min-w-0">
        <p className="font-semibold">
          {dossier.user.prenom} {dossier.user.nom}
        </p>
        <p className="truncate text-xs text-muted">{dossier.user.email}</p>
      </div>
    ),
  },
  { id: 'telephone', header: 'Téléphone', cell: (dossier) => dossier.user.telephone, className: 'whitespace-nowrap' },
  { id: 'type', header: 'Type', cell: (dossier) => KYC_TYPE[dossier.type] },
  {
    id: 'soumis',
    header: 'Soumis le',
    cell: (dossier) => (dossier.soumis_le ? formatDateTime(dossier.soumis_le) : '—'),
    className: 'whitespace-nowrap',
  },
  { id: 'statut', header: 'Statut', cell: (dossier) => <StatusBadge domain="kyc" value={dossier.statut} /> },
  {
    id: 'action',
    header: 'Action',
    className: 'text-right',
    cell: (dossier) => (
      <Link
        to={`/admin/kyc/${dossier.id}`}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-white/10"
        aria-label={`${dossier.statut === 'en_attente' ? 'Examiner' : 'Voir'} le dossier de ${dossier.user.prenom} ${dossier.user.nom}`}
      >
        {dossier.statut === 'en_attente' ? 'Examiner' : 'Voir'}
        <MdChevronRight aria-hidden className="h-4 w-4" />
      </Link>
    ),
  },
]

export function KycListPage() {
  const { values, page, setFilters, setPage } = useListParams(['statut', 'type', 'q'] as const)
  const statut: StatutFilter = STATUT_OPTIONS.some((o) => o.value === values.statut)
    ? (values.statut as StatutFilter)
    : 'en_attente'

  const filters = useMemo(
    () => ({
      statut: statut === 'tous' ? '' : statut,
      type: values.type,
      search: values.q,
      page,
    }),
    [statut, values.type, values.q, page],
  )
  const { data, isPending, isError, error, refetch, isFetching } = useKycList(filters)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          label="Statut des dossiers"
          options={[...STATUT_OPTIONS]}
          value={statut}
          // en_attente est la valeur par défaut : URL propre.
          onChange={(value) => setFilters({ statut: value === 'en_attente' ? '' : value })}
        />
        <div className="flex flex-col gap-3 sm:flex-row lg:w-[520px]">
          <SearchInput
            label="Rechercher un demandeur"
            placeholder="Nom, email ou téléphone"
            value={values.q}
            onChange={(q) => setFilters({ q })}
          />
          <SelectField
            label="Type de dossier"
            hideLabel
            className="sm:w-44"
            options={TYPE_OPTIONS}
            value={values.type}
            onChange={(event) => setFilters({ type: event.target.value })}
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
            caption="Dossiers KYC"
            columns={COLUMNS}
            data={data.results}
            getRowId={(dossier) => String(dossier.id)}
            isFetching={isFetching}
            emptyMessage={
              statut === 'en_attente' && !values.q && !values.type
                ? 'Aucun dossier en attente. Tout est à jour.'
                : 'Aucun dossier ne correspond à ces critères.'
            }
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  )
}
