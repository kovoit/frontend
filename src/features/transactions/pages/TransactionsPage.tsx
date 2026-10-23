import { useMemo, useState } from 'react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { QueryError } from '@/components/ui/QueryError'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SelectField } from '@/components/ui/SelectField'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MOYEN_PAIEMENT, TRANSACTION_STATUT, TRANSACTION_TYPE } from '@/config/enums'
import { useListParams } from '@/hooks/useListParams'
import { formatDateTime, formatFcfa } from '@/utils/format'
import { useTransactionList } from '../api'
import { RefuserDialog, VerserDialog } from '../components/RetraitDialogs'
import type { TransactionAdmin } from '../types'

// Par défaut : la file des retraits à verser à la main (Flooz / Mixx), les plus anciens d'abord.
const VUES = [
  { value: 'a_verser', label: 'Retraits à verser' },
  { value: 'toutes', label: 'Toutes les transactions' },
] as const
type Vue = (typeof VUES)[number]['value']

const tous = (label: string) => [{ value: '', label }]
const TYPE_OPTIONS = [
  ...tous('Tous les types'),
  ...Object.entries(TRANSACTION_TYPE).map(([value, label]) => ({ value, label })),
]
const STATUT_OPTIONS = [
  ...tous('Tous les statuts'),
  ...Object.entries(TRANSACTION_STATUT).map(([value, meta]) => ({ value, label: meta.label })),
]
const MOYEN_OPTIONS = [
  ...tous('Tous les moyens'),
  ...Object.entries(MOYEN_PAIEMENT).map(([value, label]) => ({ value, label })),
]

type Dialogue = { action: 'verser' | 'refuser'; retrait: TransactionAdmin } | null

function colonnes(vue: Vue, ouvrir: (dialogue: Dialogue) => void): Column<TransactionAdmin>[] {
  const base: Column<TransactionAdmin>[] = [
    {
      id: 'cree_le',
      header: 'Date',
      cell: (t) => formatDateTime(t.cree_le),
      className: 'whitespace-nowrap',
    },
    {
      id: 'utilisateur',
      header: 'Utilisateur',
      cell: ({ utilisateur }) => (
        <span className="block min-w-0">
          <span className="block font-semibold">
            {utilisateur.prenom} {utilisateur.nom}
          </span>
          <span className="block truncate text-xs text-muted">{utilisateur.email}</span>
        </span>
      ),
    },
    { id: 'type', header: 'Type', cell: (t) => TRANSACTION_TYPE[t.type] ?? t.type },
    {
      id: 'montant',
      header: 'Montant',
      className: 'text-right tabular-nums whitespace-nowrap',
      cell: (t) => formatFcfa(t.montant),
    },
    {
      id: 'mobile_money',
      header: 'Mobile Money',
      className: 'whitespace-nowrap',
      cell: (t) =>
        t.moyen_paiement ? (
          `${MOYEN_PAIEMENT[t.moyen_paiement]} · ${t.telephone}`
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ]
  if (vue === 'a_verser') {
    return [
      ...base,
      {
        id: 'actions',
        header: 'Action',
        className: 'text-right',
        cell: (t) => (
          <span className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => ouvrir({ action: 'verser', retrait: t })}
              aria-label={`Marquer versé le retrait de ${t.utilisateur.prenom} ${t.utilisateur.nom}`}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-white/10"
            >
              Versé
            </button>
            <button
              type="button"
              onClick={() => ouvrir({ action: 'refuser', retrait: t })}
              aria-label={`Refuser le retrait de ${t.utilisateur.prenom} ${t.utilisateur.nom}`}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-danger-700 hover:bg-danger-50 dark:text-danger-100 dark:hover:bg-white/10"
            >
              Refuser
            </button>
          </span>
        ),
      },
    ]
  }
  return [
    ...base,
    {
      id: 'reference',
      header: 'Référence',
      cell: (t) => (
        <span
          className="block max-w-[200px] truncate text-xs"
          title={t.reference_operateur || t.reference_externe}
        >
          {t.reference_operateur || t.reference_externe || <span className="text-muted">—</span>}
        </span>
      ),
    },
    {
      id: 'statut',
      header: 'Statut',
      cell: (t) => <StatusBadge domain="transaction" value={t.statut} />,
    },
  ]
}

export function TransactionsPage() {
  const { values, page, setFilters, setPage } = useListParams([
    'vue',
    'type',
    'statut',
    'moyen',
    'q',
  ] as const)
  const vue: Vue = values.vue === 'toutes' ? 'toutes' : 'a_verser'
  const [dialogue, setDialogue] = useState<Dialogue>(null)
  const filters = useMemo(
    () =>
      vue === 'a_verser'
        ? { type: 'retrait', statut: 'en_attente', moyen: '', recherche: '', page }
        : {
            type: values.type,
            statut: values.statut,
            moyen: values.moyen,
            recherche: values.q,
            page,
          },
    [vue, values.type, values.statut, values.moyen, values.q, page],
  )
  const { data, isPending, isError, error, refetch, isFetching } = useTransactionList(filters)
  const columns = useMemo(() => colonnes(vue, setDialogue), [vue])

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl
        label="Vue des transactions"
        options={[...VUES]}
        value={vue}
        onChange={(value) =>
          setFilters({
            vue: value === 'a_verser' ? '' : value,
            type: '',
            statut: '',
            moyen: '',
            q: '',
          })
        }
      />
      {vue === 'toutes' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Type"
            hideLabel
            options={TYPE_OPTIONS}
            value={values.type}
            onChange={(e) => setFilters({ type: e.target.value })}
          />
          <SelectField
            label="Statut"
            hideLabel
            options={STATUT_OPTIONS}
            value={values.statut}
            onChange={(e) => setFilters({ statut: e.target.value })}
          />
          <SelectField
            label="Moyen de paiement"
            hideLabel
            options={MOYEN_OPTIONS}
            value={values.moyen}
            onChange={(e) => setFilters({ moyen: e.target.value })}
          />
          <SearchInput
            label="Rechercher une transaction"
            placeholder="Nom, email, téléphone, référence"
            value={values.q}
            onChange={(q) => setFilters({ q })}
          />
        </div>
      )}

      {isPending ? (
        <Skeleton className="h-[420px]" />
      ) : isError && !data ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : data ? (
        <>
          <DataTable
            caption={vue === 'a_verser' ? 'Retraits à verser' : 'Transactions'}
            columns={columns}
            data={data.results}
            getRowId={(t) => String(t.id)}
            isFetching={isFetching}
            emptyMessage={
              vue === 'a_verser'
                ? 'Aucun retrait à verser. Tout est à jour.'
                : 'Aucune transaction ne correspond à ces critères.'
            }
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      ) : null}

      {dialogue?.action === 'verser' && (
        <VerserDialog retrait={dialogue.retrait} onClose={() => setDialogue(null)} />
      )}
      {dialogue?.action === 'refuser' && (
        <RefuserDialog retrait={dialogue.retrait} onClose={() => setDialogue(null)} />
      )}
    </div>
  )
}
