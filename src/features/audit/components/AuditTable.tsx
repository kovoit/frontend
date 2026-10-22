import { MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AUDIT_CANAL, AUDIT_ROLE } from '@/config/enums'
import { formatDateTime } from '@/utils/format'
import { actorLabel, resourceLabel } from '../format'
import type { AuditEvent } from '../types'

const COLUMNS: Column<AuditEvent>[] = [
  {
    id: 'date',
    header: 'Date',
    cell: (e) => <time dateTime={e.survenu_le}>{formatDateTime(e.survenu_le)}</time>,
    className: 'whitespace-nowrap',
  },
  {
    id: 'action',
    header: 'Action',
    cell: (e) => (
      <span className="flex flex-col">
        <span className="font-semibold">{e.libelle}</span>
        <span className="text-xs text-muted">{e.action}</span>
      </span>
    ),
  },
  {
    id: 'acteur',
    header: 'Acteur',
    cell: (e) => (
      <span className="flex flex-col">
        <span>{actorLabel(e)}</span>
        <span className="text-xs text-muted">{AUDIT_ROLE[e.acteur_role]}</span>
      </span>
    ),
  },
  {
    id: 'ressource',
    header: 'Ressource',
    cell: (e) => resourceLabel(e),
    className: 'whitespace-nowrap',
  },
  { id: 'canal', header: 'Canal', cell: (e) => AUDIT_CANAL[e.canal] ?? e.canal },
  {
    id: 'resultat',
    header: 'Résultat',
    cell: (e) => (
      <span className="flex flex-col items-start gap-1">
        <StatusBadge domain="auditResultat" value={e.resultat} />
        {e.code_motif && <span className="text-xs text-muted">{e.code_motif}</span>}
      </span>
    ),
  },
  {
    id: 'categorie',
    header: 'Catégorie',
    cell: (e) => <StatusBadge domain="auditCategorie" value={e.categorie} />,
  },
  {
    id: 'detail',
    header: 'Détail',
    className: 'text-right',
    cell: (e) => (
      <Link
        to={`/admin/audit/${e.id}`}
        aria-label={`Détail : ${e.libelle} le ${formatDateTime(e.survenu_le)}`}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-white/10"
      >
        Voir
        <MdChevronRight aria-hidden className="h-4 w-4" />
      </Link>
    ),
  },
]

type AuditTableProps = {
  events: AuditEvent[]
  isFetching?: boolean
  emptyMessage: string
  caption?: string
}

export function AuditTable({
  events,
  isFetching,
  emptyMessage,
  caption = 'Journal d’audit',
}: AuditTableProps) {
  return (
    <DataTable
      caption={caption}
      columns={COLUMNS}
      data={events}
      getRowId={(e) => e.id}
      isFetching={isFetching}
      emptyMessage={emptyMessage}
    />
  )
}
