import { SlidersHorizontal } from 'lucide-react'
import FilterSelect from '../common/FilterSelect'
import { Button } from '../common/Button'
import { formatNumber } from '../../utils/format'

/**
 * Analytics filter toolbar.
 * Changing any control recomputes the panels from the demonstration-rule
 * records loaded from the local synthetic CSV dataset.
 */
export function AnalyticsFilters({
  filters,
  onChange,
  onReset,
  options,
  filteredCounts,
  className,
}) {
  const update = (key, value) => onChange({ ...filters, [key]: value })

  const dirty =
    filters.period !== '14d' ||
    filters.atmId !== 'all' ||
    filters.type !== 'all' ||
    filters.risk !== 'all' ||
    filters.location !== 'all'

  return (
    <section
      aria-label="Analytics filters"
      className={`rounded-xl border border-hairline bg-panel/80 p-4 ${className ?? ''}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
          Analytics filters
        </p>

        <div className="flex items-center gap-3">
          <span className="text-xs text-dim">
            <span className="tabular font-semibold text-body">
              {formatNumber(filteredCounts?.transactions ?? 0)}
            </span>{' '}
            transactions ·{' '}
            <span className="tabular font-semibold text-body">
              {formatNumber(filteredCounts?.anomalies ?? 0)}
            </span>{' '}
            flagged anomalies in view
          </span>

          <Button variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          label="Time period"
          value={filters.period}
          onChange={(value) => update('period', value)}
          options={options.periods}
        />
        <FilterSelect
          label="ATM terminal"
          value={filters.atmId}
          onChange={(value) => update('atmId', value)}
          options={options.atms}
        />
        <FilterSelect
          label="Transaction type"
          value={filters.type}
          onChange={(value) => update('type', value)}
          options={options.types}
        />
        <FilterSelect
          label="Risk level"
          value={filters.risk}
          onChange={(value) => update('risk', value)}
          options={options.risks}
        />
        <FilterSelect
          label="Malawi demonstration location"
          value={filters.location}
          onChange={(value) => update('location', value)}
          options={options.locations}
        />
      </div>
    </section>
  )
}

export default AnalyticsFilters
