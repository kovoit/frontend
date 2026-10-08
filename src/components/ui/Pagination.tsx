import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { PAGE_SIZE } from '@/config/pagination'
import { formatNumber } from '@/utils/format'
import { Button } from './Button'

type PaginationProps = {
  page: number
  count: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, count, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  if (count === 0) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, count)

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        {formatNumber(from)}–{formatNumber(to)} sur {formatNumber(count)}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="px-3"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          <MdChevronLeft aria-hidden className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold tabular-nums">
          Page {page} / {pages}
        </span>
        <Button
          variant="secondary"
          className="px-3"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          <MdChevronRight aria-hidden className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  )
}
