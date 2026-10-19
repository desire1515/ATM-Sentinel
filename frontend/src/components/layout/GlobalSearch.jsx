import { useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search, TriangleAlert, Wallet } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useDismiss } from '../../hooks/useDismiss'
import { searchMlData } from '../../services/searchService'
import { useServiceQuery } from '../../hooks/useServiceQuery'
import RiskBadge from '../common/RiskBadge'

const GROUPS = [
  { key: 'transactions', label: 'ATM observations', icon: Wallet },
  { key: 'anomalies', label: 'Anomalies', icon: TriangleAlert },
]

/**
 * Header global search.
 * Searches the CSV-backed transaction observations, anomalies and terminals.
 */
export function GlobalSearch({ className, compact = false }) {
  const id = useId()
  const inputId = `${id}-input`
  const resultsId = `${id}-results`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  const debounced = useDebouncedValue(query, 220)
  const { data } = useServiceQuery(() => searchMlData(debounced), {
    deps: [debounced],
    enabled: debounced.trim().length >= 2,
  })
  const results = data ?? { transactions: [], atms: [], anomalies: [], isEmpty: true }
  const visibleGroups = GROUPS
  const hasVisibleResults = visibleGroups.some((group) => results[group.key].length > 0)

  useDismiss(containerRef, () => setOpen(false), { active: open })

  const hasQuery = debounced.trim().length >= 2
  const firstResult =
    visibleGroups.map((group) => results[group.key][0]).find(Boolean) ?? null

  const go = (item) => {
    if (!item) return
    setOpen(false)
    setQuery('')
    navigate(item.to)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        Search ATM observations, anomalies and terminals
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim"
          aria-hidden="true"
        />

        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={resultsId}
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') go(firstResult)
            if (event.key === 'Escape') setOpen(false)
          }}
          placeholder={compact ? 'Search…' : 'Search observation, ATM ID or name…'}
          className="h-9 w-full rounded-lg border border-hairline bg-panel-soft pl-9 pr-3 text-sm text-body placeholder:text-dim focus:border-brand/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      {open && hasQuery ? (
        <div
          id={resultsId}
          role="listbox"
          className="absolute right-0 top-11 z-40 max-h-[420px] w-[min(92vw,420px)] overflow-y-auto rounded-xl border border-hairline bg-ink/98 p-2 shadow-raised backdrop-blur scroll-area"
        >
          {!hasVisibleResults ? (
            <p className="px-3 py-6 text-center text-xs text-muted">
              No accessible dataset record matches “{debounced}”.
            </p>
          ) : (
            visibleGroups.map((group) => {
              const items = results[group.key]
              if (!items.length) return null

              return (
                <div key={group.key} className="mb-1 last:mb-0">
                  <p className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-dim">
                    <group.icon className="h-3 w-3" aria-hidden="true" />
                    {group.label}
                  </p>

                  <ul>
                    {items.map((item) => (
                      <li key={`${group.key}-${item.id}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected="false"
                          onClick={() => go(item)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-panel-soft"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-body">
                              {item.label}
                            </span>
                            <span className="block truncate text-[11px] text-dim">{item.meta}</span>
                          </span>

                          <span className="flex shrink-0 items-center gap-2">
                            {item.risk ? <RiskBadge risk={item.risk} size="sm" showIcon={false} /> : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          )}

          <p className="flex items-center gap-1.5 border-t border-hairline px-3 py-2 text-[10px] text-dim">
            <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
            Enter opens the first match · Esc closes
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default GlobalSearch
