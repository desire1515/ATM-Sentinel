import { useMemo, useState } from 'react'

/**
 * Client-side pagination for the transaction/anomaly explorers.
 * Resets safely whenever the page size or the underlying record count changes.
 */
export function usePagination(items, { pageSize: initialPageSize = 10 } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  const range = {
    from: totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, totalItems),
    total: totalItems,
  }

  return {
    page: safePage,
    pageSize,
    totalPages,
    pageItems,
    range,
    setPage,
    setPageSize: (size) => {
      setPageSize(size)
      setPage(1)
    },
    goToNextPage: () => setPage((current) => Math.min(current + 1, totalPages)),
    goToPreviousPage: () => setPage((current) => Math.max(current - 1, 1)),
    reset: () => setPage(1),
  }
}

export default usePagination
