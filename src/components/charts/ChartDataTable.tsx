type ChartDataTableProps = {
  caption: string
  columns: string[]
  rows: Array<Array<string | number>>
}

/** Vue tableau d'un graphique (accessibilité, lecteurs d'écran, copie des chiffres). */
export function ChartDataTable({ caption, columns, rows }: ChartDataTableProps) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer select-none font-semibold text-brand-700 hover:text-brand-900 dark:text-brand-200 dark:hover:text-white">
        Afficher les données
      </summary>
      <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-line dark:border-white/10">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-bg text-xs uppercase text-muted dark:bg-navy-900">
            <tr>
              {columns.map((column, i) => (
                <th key={column} scope="col" className={i === 0 ? 'px-3 py-2' : 'px-3 py-2 text-right'}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-t border-line dark:border-white/10">
                {row.map((cell, i) => (
                  <td key={i} className={i === 0 ? 'px-3 py-2' : 'px-3 py-2 text-right tabular-nums'}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
