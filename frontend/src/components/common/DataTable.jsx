import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { TableSkeleton } from './LoadingState'

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/**
 * Data table used by the transaction, anomaly and ATM explorers.
 *
 *  - horizontal scroll on small screens (never breaks the page layout)
 *  - optional sorting driven by a `field-direction` token
 *  - keyboard-accessible rows when `onRowClick` is provided
 *  - built-in loading skeleton and empty state
 */
export function DataTable({
  columns,
  rows,
  rowKey = (row, index) => row.id ?? index,
  onRowClick,
  loading = false,
  skeletonRows = 6,
  emptyState,
  caption,
  ariaLabel,
  dense = false,
  sortToken,
  onSortChange,
  minWidth = 'min-w-[860px]',
  footer,
  getRowClassName,
  className,
}) {
  const [activeField, activeDirection] = String(sortToken ?? '').split('-')
  const cellPadding = dense ? 'px-3 py-2' : 'px-4 py-3'

  const handleSort = (column) => {
    if (!column.sortKey || !onSortChange) return
    const nextDirection =
      activeField === column.sortKey && activeDirection === 'desc' ? 'asc' : 'desc'
    onSortChange(`${column.sortKey}-${nextDirection}`)
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-hairline bg-panel/80', className)}>
      {caption ? (
        <p className="border-b border-hairline/70 px-4 py-2 text-xs text-muted">{caption}</p>
      ) : null}

      {loading ? (
        <TableSkeleton rows={skeletonRows} columns={Math.min(columns.length, 7)} />
      ) : (
        <div className="scroll-area max-h-[620px] overflow-x-auto overflow-y-auto">
          <table className={cn('w-full border-collapse text-sm', minWidth)}>
            <caption className="sr-only">{ariaLabel ?? caption ?? 'Data table'}</caption>

            <thead>
              <tr className="bg-panel-soft/95 text-[11px] uppercase tracking-[0.12em] text-muted backdrop-blur">
                {columns.map((column) => {
                  const sortable = Boolean(column.sortKey && onSortChange)
                  const isActive = sortable && activeField === column.sortKey

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        isActive
                          ? activeDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : sortable
                            ? 'none'
                            : undefined
                      }
                      className={cn(
                        'whitespace-nowrap border-b border-hairline font-semibold',
                        cellPadding,
                        ALIGN[column.align] ?? ALIGN.left,
                        column.headerClassName,
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded transition-colors hover:text-body',
                            isActive && 'text-brand',
                            column.align === 'right' && 'flex-row-reverse',
                          )}
                        >
                          {column.header}
                          {isActive ? (
                            activeDirection === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="border-b border-hairline/70 p-4">
                    {emptyState}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={rowKey(row, index)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              onRowClick(row)
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn(
                      'border-b border-hairline/60 transition-colors duration-150 last:border-b-0',
                      onRowClick && 'cursor-pointer hover:bg-panel-soft/70',
                      getRowClassName?.(row),
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'align-middle text-body',
                          cellPadding,
                          ALIGN[column.align] ?? ALIGN.left,
                          column.cellClassName,
                        )}
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {footer}
    </div>
  )
}

export default DataTable
