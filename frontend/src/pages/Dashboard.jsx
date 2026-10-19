import { useMemo } from 'react'
import {
  Activity,
  CheckCircle2,
  CircleCheck,
  RefreshCw,
  Server,
  ShieldAlert,
  TriangleAlert,
  Waypoints,
} from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import StatCard from '../components/common/StatCard'
import SectionHeader from '../components/common/SectionHeader'
import { Button } from '../components/common/Button'
import { Card, CardHeader } from '../components/common/Card'
import ErrorState from '../components/common/ErrorState'
import RiskBadge from '../components/common/RiskBadge'
import TransactionActivityChart from '../components/dashboard/TransactionActivityChart'
import AnomalyDistributionChart from '../components/dashboard/AnomalyDistributionChart'
import AnomalyTrendChart from '../components/dashboard/AnomalyTrendChart'
import RecentAlerts from '../components/dashboard/RecentAlerts'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { dashboardService } from '../services'
import { formatMwkCurrency, formatNumber, formatRelativeTime } from '../utils/format'

const KPI_ICONS = { Activity, CheckCircle2, TriangleAlert, ShieldAlert }

/** An upward trend is healthy for normal volume but undesirable for anomalies. */
const TREND_TONE = {
  total: 'ok',
  normal: 'ok',
  anomalies: 'risk',
  'withdrawal-total': 'dim',
}

export function Dashboard() {
  const { data, loading, refreshing, error, refetch } = useServiceQuery(() =>
    dashboardService.fetchDashboardOverview(),
  )

  const riskBreakdown = useMemo(() => {
    const rows = data?.riskBreakdown ?? []
    const total = rows.reduce((sum, row) => sum + row.value, 0)

    return rows.map((row) => ({ ...row, share: total ? (row.value / total) * 100 : 0 }))
  }, [data?.riskBreakdown])

  return (
    <PageContainer className="space-y-5">
      <SectionHeader
        level={2}
        eyebrow="Monitoring"
        title="Synthetic Malawi Overview"
        description="Overview of synthetic ATM transactions and precomputed Isolation Forest anomaly predictions."
        actions={
          <>
            {data?.systemStatus?.lastSync ? (
              <span className="hidden text-[11px] text-dim sm:inline">
                Updated {formatRelativeTime(data.systemStatus.lastSync)}
              </span>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={refetch}
            >
              Refresh
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState
          description="The dashboard service could not be read."
          detail={error.message}
          onRetry={refetch}
        />
      ) : null}

      <section
        aria-label="Key performance indicators"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {(loading ? Array.from({ length: 4 }) : data?.kpis ?? []).map((kpi, index) => {
          if (loading) return <StatCard key={index} loading />

          return (
            <StatCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.id === 'withdrawal-total' ? formatMwkCurrency(kpi.value) : formatNumber(kpi.value)}
              hint={kpi.hint}
              icon={KPI_ICONS[kpi.icon]}
              tone={kpi.tone}
              trend={{ ...kpi.trend, tone: TREND_TONE[kpi.id] ?? 'dim' }}
            />
          )
        })}
      </section>

      <section
        aria-label="Activity and distribution"
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <div className="xl:col-span-2">
          <TransactionActivityChart data={data?.activitySeries} loading={loading} />
        </div>
        <AnomalyDistributionChart data={data?.distribution} loading={loading} />
      </section>

      <section
        aria-label="Anomaly trend and risk split"
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <div className="xl:col-span-2">
          <AnomalyTrendChart data={data?.anomalyTrend} loading={loading} />
        </div>

        <Card className="flex h-full flex-col">
          <CardHeader
            title="Demonstration Review Breakdown"
            description="Model risk tiers for flagged transactions; an anomaly is not a fraud finding."
            icon={ShieldAlert}
          />

          <ul className="mt-4 space-y-3">
            {riskBreakdown.map((row) => (
              <li key={row.key}>
                <div className="flex items-center justify-between gap-2">
                  <RiskBadge risk={row.key} size="sm" />
                  <span className="tabular text-xs font-semibold text-body">
                    {loading ? '—' : formatNumber(row.value)}
                  </span>
                </div>

                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-soft">
                  <span
                    className={
                      row.key === 'high'
                        ? 'block h-full rounded-full bg-risk'
                        : row.key === 'medium'
                          ? 'block h-full rounded-full bg-warn'
                          : 'block h-full rounded-full bg-ok'
                    }
                    style={{ width: `${row.share}%` }}
                  />
                </div>

                <p className="mt-1 text-[11px] text-dim">
                  {loading ? '…' : `${row.share.toFixed(1)}% of flagged observations`}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-auto space-y-2 border-t border-hairline/70 pt-4">
            <p className="flex items-center gap-2 text-xs text-muted">
              <CircleCheck className="h-3.5 w-3.5 text-ok" aria-hidden="true" />
              Model anomaly rate in dataset:{' '}
              <span className="tabular font-semibold text-body">
                {data?.anomalySummary?.anomalyRate ?? '—'}%
              </span>
            </p>
            <p className="flex items-center gap-2 text-xs text-muted">
              <Waypoints className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              Monitored ATMs in dataset:{' '}
              <span className="tabular font-semibold text-body">
                {data?.summary?.monitoredAtms ?? '—'}
              </span>
            </p>
            <p className="flex items-center gap-2 text-xs text-muted">
              <Server className="h-3.5 w-3.5 text-warn" aria-hidden="true" />
              Model results:{' '}
              <span className="font-medium text-warn">
                {data?.systemStatus?.modelStatus ?? 'Not connected'}
              </span>
            </p>
          </div>
        </Card>
      </section>

      <RecentAlerts alerts={data?.alerts} loading={loading} />
    </PageContainer>
  )
}

export default Dashboard
