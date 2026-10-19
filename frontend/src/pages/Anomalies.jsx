import { useMemo, useState } from 'react'
import {
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import ErrorState from '../components/common/ErrorState'
import StatCard from '../components/common/StatCard'
import SearchInput from '../components/common/SearchInput'
import FilterSelect from '../components/common/FilterSelect'
import { Button } from '../components/common/Button'
import Pagination from '../components/common/Pagination'
import AnomalyTable from '../components/anomalies/AnomalyTable'
import RiskDistributionChart from '../components/anomalies/RiskDistributionChart'
import AnomalyTrendChart from '../components/dashboard/AnomalyTrendChart'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { usePagination } from '../hooks/usePagination'
import { usePreferences } from '../context/preferences-context'
import { anomalyService } from '../services'
import { ANOMALY_SORT_OPTIONS, TIMEFRAMES } from '../utils/filters'
import { DEFAULT_PAGE_SIZE } from '../utils/constants'
import { formatNumber, formatPercent } from '../utils/format'

const INITIAL_FILTERS = {
  query: '',
  atmId: 'all',
  location: 'all',
  risk: 'all',
  status: 'all',
  type: 'all',
  timeframe: 'all',
}

const EMPTY_RECORDS = []

export function Anomalies() {
  const { compactMode } = usePreferences()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [sort, setSort] = useState('timestamp-desc')

  const { data, loading, refreshing, error, refetch } = useServiceQuery(() =>
    anomalyService.fetchAnomalies(),
  )

  const records = useMemo(() => data?.records ?? EMPTY_RECORDS, [data])
  const summary = data?.summary

  const filtered = useMemo(
    () => anomalyService.queryAnomalies(records, { filters, sort }).records,
    [records, filters, sort],
  )

  const pagination = usePagination(filtered, {
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const update = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
    pagination.setPage(1)
  }

  const updateSort = (value) => {
    setSort(value)
    pagination.setPage(1)
  }

  const atmOptions = useMemo(
    () => [
      { value: 'all', label: 'All ATMs' },
      ...[...new Set(records.map((record) => record.atmId))]
        .sort()
        .map((atmId) => ({
          value: atmId,
          label: atmId,
        })),
    ],
    [records],
  )

  const locationOptions = useMemo(
    () => [
      { value: 'all', label: 'All Malawi demonstration locations' },
      ...[...new Set(records.map((record) => record.location))].sort().map((location) => ({
        value: location,
        label: location,
      })),
    ],
    [records],
  )

  return (
    <PageContainer className="space-y-5">
      <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          ISOLATION FOREST RESULTS
        </p>
        <p className="mt-1 text-sm text-muted">
          These predictions and anomaly scores come from the precomputed unsupervised model.
          The MWK 100,000 withdrawal rule is a separate comparison and does not determine these flags.
        </p>
        <p className="mt-1 text-xs text-dim">
          Risk tier cutoffs use all scored transactions: Low starts at the 90th score percentile,
          Medium at the 95th, and High at the 99th (higher tiers take precedence). The model flags
          the highest 5%, so flagged observations fall in Medium or High; these tiers are not fraud
          probabilities.
        </p>
      </div>

      <SectionHeader
        level={2}
        eyebrow="Detection results"
        title="Model-Flagged Anomalies"
        description="Transactions flagged as unusual by Isolation Forest. These are not confirmed fraud cases."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={refetch}
          >
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState
          description="The anomaly detection results could not be loaded."
          detail={error.message}
          onRetry={refetch}
        />
      ) : null}

      <section
        aria-label="Anomaly summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Flagged anomalies"
          value={formatNumber(summary?.anomalies ?? 0)}
          hint={`${formatPercent(summary?.anomalyRate ?? 0, {
            decimals: 2,
          })} of all transactions`}
          icon={TriangleAlert}
          tone="brand"
          loading={loading}
        />

        <StatCard
          label="High review tier"
          value={formatNumber(summary?.high ?? 0)}
          hint="Model-flagged transactions in the highest model-risk tier"
          icon={ShieldAlert}
          tone="risk"
          loading={loading}
        />

        <StatCard
          label="Medium review tier"
          value={formatNumber(summary?.medium ?? 0)}
          hint="Model-flagged transactions in the medium model-risk tier"
          icon={TriangleAlert}
          tone="warn"
          loading={loading}
        />

        <StatCard
          label="Low review tier"
          value={formatNumber(summary?.low ?? 0)}
          hint="Model-flagged transactions in the low model-risk tier"
          icon={ShieldCheck}
          tone="ok"
          loading={loading}
        />
      </section>

      <section
        aria-label="Anomaly charts"
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <div className="xl:col-span-2">
          <AnomalyTrendChart
            data={data?.trend}
            loading={loading}
          />
        </div>

        <RiskDistributionChart
          data={data?.byRisk}
          loading={loading}
          scope="flagged"
        />
      </section>

      <section
        aria-label="Anomaly filters"
        className="rounded-xl border border-hairline bg-panel/80 p-4"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            <SlidersHorizontal
              className="h-3.5 w-3.5 text-brand"
              aria-hidden="true"
            />
            Filters
          </p>

          <span className="text-xs text-dim">
            <span className="tabular font-semibold text-body">
              {formatNumber(filtered.length)}
            </span>{' '}
            matching transactions
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SearchInput
            className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
            label="Search transactions"
            value={filters.query}
            onChange={(value) => update('query', value)}
            placeholder="Transaction ID, ATM ID or simulated Malawi location…"
          />

          <FilterSelect
            label="ATM terminal"
            value={filters.atmId}
            onChange={(value) => update('atmId', value)}
            options={atmOptions}
          />

          <FilterSelect
            label="Malawi demonstration location"
            value={filters.location}
            onChange={(value) => update('location', value)}
            options={locationOptions}
          />

          <FilterSelect
            label="Risk level"
            value={filters.risk}
            onChange={(value) => update('risk', value)}
            options={[
              { value: 'all', label: 'All risk levels' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
              { value: 'Normal', label: 'Normal' },
            ]}
          />

          <FilterSelect
            label="Detection status"
            value={filters.status}
            onChange={(value) => update('status', value)}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'Flagged for Review', label: 'Flagged for Review' },
              { value: 'Cleared', label: 'Cleared' },
            ]}
          />

          <FilterSelect
            label="Time period"
            value={filters.timeframe}
            onChange={(value) => update('timeframe', value)}
            options={TIMEFRAMES.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <FilterSelect
            label="Sort by"
            value={sort}
            onChange={updateSort}
            options={ANOMALY_SORT_OPTIONS}
          />
        </div>
      </section>

      <AnomalyTable
        rows={pagination.pageItems}
        loading={loading}
        dense={compactMode}
        sortToken={sort}
        onSortChange={updateSort}
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            range={pagination.range}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            itemLabel="transactions"
            className="bg-panel-soft/40"
          />
        }
      />
    </PageContainer>
  )
}

export default Anomalies
