import { useId } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { PAGE_SIZES } from '../../utils/constants'
import { formatNumber } from '../../utils/format'

/**
 * Table pagination with a "Showing X–Y of Z" summary.
 * On small screens the summary stacks above the controls so nothing is clipped.
 */
export function Pagination({
  page,
  totalPages,
  range,
  pageSize,
  pageSizeOptions = PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
  showPageSize = true,
  className,
}) {
  const pageSizeId = useId()
  const start = totalPages === 0 ? 0 : range.from
  const end = totalPages === 0 ? 0 : range.to

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col gap-3 border-t border-hairline/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4',
        className,
      )}
    >
      <p className="text-xs text-muted">
        Showing{' '}
        <span className="tabular font-semibold text-body">
          {formatNumber(start)}–{formatNumber(end)}
        </span>{' '}
        of <span className="tabular font-semibold text-body">{formatNumber(range.total)}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {showPageSize ? (
          <div className="flex items-center gap-2 text-xs text-muted">
            <label htmlFor={pageSizeId} className="whitespace-nowrap">
              Rows
            </label>
            <select
              id={pageSizeId}
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-8 rounded-md border border-hairline bg-panel-soft px-2 text-xs text-body focus:border-brand/60 focus:outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-panel-soft text-muted transition-colors hover:text-body disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <span className="tabular px-1 text-xs text-muted">
            Page <span className="font-semibold text-body">{page}</span> of {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-panel-soft text-muted transition-colors hover:text-body disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Pagination
