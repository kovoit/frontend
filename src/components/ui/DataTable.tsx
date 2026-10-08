import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type Column<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  /** Classes de la cellule (alignement, largeur, masquage responsive) */
  className?: string
}

type DataTableProps<T> = {
  caption: string
  columns: Column<T>[]
  data: T[]
  getRowId: (row: T) => string
  emptyMessage: string
  /** Rechargement en cours avec des données déjà affichées */
  isFetching?: boolean
}

/** Tableau Horizon (TanStack Table) ; tri, filtres et pagination sont faits par l'API. */
export function DataTable<T>({
  caption,
  columns,
  data,
  getRowId,
  emptyMessage,
  isFetching = false,
}: DataTableProps<T>) {
  const tableColumns = useMemo(() => {
    const helper = createColumnHelper<T>()
    return columns.map((column) =>
      helper.display({
        id: column.id,
        header: column.header,
        cell: (info) => column.cell(info.row.original),
        meta: { className: column.className },
      }),
    )
  }, [columns])

  // eslint-disable-next-line react-hooks/incompatible-library -- API TanStack Table, pas de mémoïsation automatique requise
  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  const cellClass = (meta: unknown) => (meta as { className?: string } | undefined)?.className

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-card border border-line bg-surface shadow-card transition-opacity dark:border-white/10 dark:bg-navy-800 dark:shadow-none',
        isFetching && 'opacity-60',
      )}
      aria-busy={isFetching || undefined}
    >
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-white/10">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className={cn('px-4 py-3 font-semibold', cellClass(header.column.columnDef.meta))}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-line last:border-0 hover:bg-bg dark:border-white/10 dark:hover:bg-white/5"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn('px-4 py-3 align-middle', cellClass(cell.column.columnDef.meta))}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
