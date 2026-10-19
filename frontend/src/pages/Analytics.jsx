import { useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  Waypoints,
} from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import ErrorState from '../components/common/ErrorState'
import StatCard from '../components/common/StatCard'
import { Button } from '../components/common/Button'
import { Card, CardHeader } from '../components/common/Card'
import AnalyticsFilters from '../components/analytics/AnalyticsFilters'
import VolumeAndRateChart from '../components/analytics/VolumeAndRateChart'
import DistributionChart from '../components/analytics/DistributionChart'
import CategoryBarChart from '../components/analytics/CategoryBarChart'
import NormalVsAnomalyPanel from '../components/analytics/NormalVsAnomalyPanel'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { analyticsService } from '../services'
import { formatNumber, formatPercent } from '../utils/format'

const INITIAL_FILTERS = { period: '14d', atmId: 'all', type: 'all', risk: 'all', location: 'all' }

const EMPTY_OPTIONS = { periods: [], atms: [], types: [], risks: [] }

/**
 * Behavioural analytics.
 * Every panel is recomputed from the Isolation Forest results whenever a filter
 * changes, so the dashboard reports what the current selection actually contains.
 */
export function Analytics() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const { data, loading, refreshing, error, refetch } = useServiceQuery(() =>
    analyticsService.fetchAnalyticsDataset(),
  )

  const derived = useMemo(
    () =>
      analyticsService.deriveAnalytics({
        transactions: data?.transactions ?? [],
        anomalies: data?.anomalies ?? [],
        filters,
      }),
    [data, filters],
  )

  const meta = data?.meta

  return (
    <PageContainer className="space-y-5">
      <SectionHeader
        level={2}
        eyebrow="Analytics"
        title="Synthetic Malawi Transaction Analytics"
        description={`Distribution and trend analysis across ${formatNumber(meta?.totalTransactions ?? 0)} synthetic transactions from ${meta?.earliest ?? '—'} to ${meta?.latest ?? '—'}.`}
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
          description="The analytics dataset could not be read."
          detail={error.message}
          onRetry={refetch}
        />
      ) : null}

      <AnalyticsFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        options={data?.filterOptions ?? EMPTY_OPTIONS}
        filteredCounts={derived.filteredCounts}
      />
      <p className="text-[11px] text-dim" aria-live="polite">
        Selected data window:{' '}
        {derived.volumeSeries[0]?.day ?? '—'} to{' '}
        {derived.volumeSeries.at(-1)?.day ?? '—'} · Period filter: {
          data?.filterOptions.periods.find((period) => period.value === filters.period)?.label ?? '—'
        }
      </p>

      <section
        aria-label="Analytics headline statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Transactions in view"
          value={formatNumber(derived.filteredCounts.transactions)}
          hint={`Across ${derived.statistics.daysCovered} day(s)`}
          icon={BarChart3}
          tone="brand"
          loading={loading}
        />
        <StatCard
          label="Anomalies in view"
          value={formatNumber(derived.filteredCounts.anomalies)}
          hint={`${formatPercent(derived.filteredCounts.anomalyRate, { decimals: 2 })} of records in view`}
          icon={TriangleAlert}
          tone="warn"
          loading={loading}
        />
        <StatCard
          label="Model-flagged anomalies"
          value={formatNumber(derived.statistics.flaggedTransactionCount)}
          hint="Transactions flagged by Isolation Forest"
          icon={Activity}
          tone="risk"
          loading={loading}
        />
        <StatCard
          label="Peak activity hour"
          value={derived.statistics.peakHour}
          hint={`Most flagged type: ${derived.statistics.topAnomalousType}`}
          icon={Clock}
          tone="ok"
          loading={loading}
        />
      </section>

      <section
        aria-label="Transaction volume, amount distribution and temporal patterns"
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <div className="xl:col-span-2">
          <VolumeAndRateChart data={derived.volumeSeries} loading={loading} />
        </div>
        <DistributionChart
          title="Transaction amount distribution"
          description="Synthetic MWK transaction-amount buckets, grouped by the model prediction."
          icon={Activity}
          data={derived.amountDistribution}
          loading={loading}
          compactTicks
          height={300}
        />
      </section>

      <section
        aria-label="Time and review-flag distributions"
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <div className="xl:col-span-2">
          <DistributionChart
            title="Source-recorded hour distribution"
            description="Records per recorded hour. The source timezone is not documented."
            icon={Calendar}
            data={derived.hourDistribution}
            loading={loading}
            height={300}
            note={`Hourly distribution of all transactions from ${meta?.earliest ?? '—'} to ${meta?.latest ?? '—'}.`}
          />
        </div>
        <DistributionChart
          title="Isolation Forest anomaly score distribution"
          description="Raw decision scores are shown; higher scores indicate greater model anomaly."
          icon={Gauge}
          data={derived.scoreDistribution}
          loading={loading}
          compactTicks
          height={300}
          note="Anomaly score is not a fraud probability or model confidence."
        />
      </section>

      <section
        aria-label="Anomalies per terminal and location"
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <CategoryBarChart
          title="Anomalies by ATM"
          description="Isolation Forest model flags per simulated ATM."
          icon={Waypoints}
          data={derived.byAtm}
          seriesKeys={['high', 'medium', 'low']}
          height={300}
        />
        <CategoryBarChart
          title="Anomalies by location"
          description="Isolation Forest model flags grouped by simulated location."
          icon={MapPin}
          data={derived.byLocation}
          height={300}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NormalVsAnomalyPanel rows={derived.normalVsAnomaly} loading={loading} />
        </div>

        <Card className="flex h-full flex-col">
          <CardHeader
            title="Interpretation notes"
            description="How to read these analytics honestly."
            icon={ShieldAlert}
          />
          <ul className="mt-4 space-y-3 text-[11px] leading-5 text-muted">
            <li>
              Values describe precomputed Isolation Forest predictions across the selected dataset window.
            </li>
            <li>
              The model marks unusual behavioral patterns for review. The withdrawal threshold is a separate optional comparison.
            </li>
            <li>
              A flag is not a confirmed fraud finding and no trained-model accuracy metric is claimed.
            </li>
            <li>
              Isolation Forest decision scores are not probabilities or confidence values.
            </li>
          </ul>

          <p className="mt-auto border-t border-hairline/70 pt-4 text-[11px] text-dim">
            Dataset: {meta?.earliest ?? '—'} to {meta?.latest ?? '—'} · Total transactions:{' '}
            {formatNumber(meta?.totalTransactions ?? 0)} · Model-flagged anomalies:{' '}
            {formatNumber(meta?.flaggedAnomalies ?? 0)} · Review rate:{' '}
            {formatPercent(meta?.anomalyRate ?? 0, { decimals: 2 })}
          </p>
        </Card>
      </section>
    </PageContainer>
  )
}

export default Analytics
