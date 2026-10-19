import { SlidersHorizontal } from 'lucide-react'
import SearchInput from '../common/SearchInput'
import FilterSelect from '../common/FilterSelect'
import { Button } from '../common/Button'
import { formatNumber } from '../../utils/format'
import {
  TIMEFRAMES,
  TRANSACTION_RISK_OPTIONS,
  TRANSACTION_SORT_OPTIONS,
} from '../../utils/filters'
import { TRANSACTION_TYPES } from '../../utils/constants'

/**
 * Filter toolbar for the transaction explorer.
 * Purely frontend state — no request is made until the data layer is connected.
 */
export function TransactionFilters({
  filters,
  onChange,
  onReset,
  sort,
  onSortChange,
  atmOptions = [],
  locationOptions = [],
  resultCount = 0,
  className,
}) {
  const update = (key, value) => onChange({ ...filters, [key]: value })

  const dirty =
    filters.query !== '' ||
    filters.atmId !== 'all' ||
    filters.location !== 'all' ||
    filters.type !== 'all' ||
    filters.risk !== 'all' ||
    filters.status !== 'all' ||
    filters.timeframe !== 'all' ||
    filters.onlyAnomalies !== false

  return (
    <section
      aria-label="Transaction filters"
      className={`rounded-xl border border-hairline bg-panel/80 p-4 ${className ?? ''}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
          Filters
        </p>

        <div className="flex items-center gap-3">
          <span className="text-xs text-dim">
            <span className="tabular font-semibold text-body">{formatNumber(resultCount)}</span> matching
            records
          </span>

          <Button variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>
            Clear filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SearchInput
          className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
          label="Search transactions"
          value={filters.query}
          onChange={(value) => update('query', value)}
          placeholder="Observation ID, ATM ID or Malawi location…"
        />

        <FilterSelect
          label="ATM terminal"
          value={filters.atmId}
          onChange={(value) => update('atmId', value)}
          options={atmOptions}
        />

        <FilterSelect
          label="Malawi demonstration location"
          value={filters.location ?? 'all'}
          onChange={(value) => update('location', value)}
          options={locationOptions}
        />

        <FilterSelect
          label="Activity type"
          value={filters.type}
          onChange={(value) => update('type', value)}
          options={[
            { value: 'all', label: 'All types' },
            ...TRANSACTION_TYPES.map((type) => ({ value: type, label: type })),
          ]}
        />

        <FilterSelect
          label="Risk level"
          value={filters.risk}
          onChange={(value) => update('risk', value)}
          options={TRANSACTION_RISK_OPTIONS}
        />

        <FilterSelect
          label="Transaction status"
          value={filters.status}
          onChange={(value) => update('status', value)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Failed', label: 'Failed' },
            { value: 'Declined', label: 'Declined' },
          ]}
        />

        <FilterSelect
          label="Time period"
          value={filters.timeframe}
          onChange={(value) => update('timeframe', value)}
          options={TIMEFRAMES.map((option) => ({ value: option.value, label: option.label }))}
        />

        <FilterSelect
          label="Sort by"
          value={sort}
          onChange={onSortChange}
          options={TRANSACTION_SORT_OPTIONS}
        />

        <div className="flex items-end">
          <label className="flex w-full items-center gap-2 rounded-lg border border-hairline bg-panel-soft px-3 py-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={filters.onlyAnomalies}
              onChange={(event) => update('onlyAnomalies', event.target.checked)}
              className="h-3.5 w-3.5 accent-brand"
            />
            Only anomalous records
          </label>
        </div>
      </div>
    </section>
  )
}

export default TransactionFilters
