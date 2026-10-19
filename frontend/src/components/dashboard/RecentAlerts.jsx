import { Link } from 'react-router-dom'
import { ArrowRight, BellRing } from 'lucide-react'
import { Card, CardHeader } from '../common/Card'
import RiskBadge from '../common/RiskBadge'
import StatusBadge from '../common/StatusBadge'
import ScoreBar from '../common/ScoreBar'
import EmptyState from '../common/EmptyState'
import { TableSkeleton } from '../common/LoadingState'
import { formatMwkCurrency, formatRelativeTime } from '../../utils/format'

/**
 * Recent anomaly alerts.
 * Rendered as a responsive row list rather than a scrollable table so the panel
 * stays readable from 375px upwards.
 */
export function RecentAlerts({ alerts = [], loading = false, limit = 8 }) {
  const visible = alerts.slice(0, limit)

  return (
    <Card padding="none" className="flex h-full flex-col">
      <div className="p-4 sm:p-5">
        <CardHeader
          title="Recent Alerts"
          description="Latest synthetic transactions flagged by the precomputed Isolation Forest model."
          icon={BellRing}
          actions={
            <Link
              to="/anomalies"
              className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-panel-soft px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand/40 hover:text-brand"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
        />
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : visible.length === 0 ? (
        <div className="px-4 pb-5 sm:px-5">
          <EmptyState
            compact
            title="No model anomalies found."
            description="The Isolation Forest results contain no flagged transactions."
          />
        </div>
      ) : (
        <ul className="divide-y divide-hairline/60">
          {visible.map((alert) => (
            <li key={alert.id}>
              <Link
                to={`/anomalies/${alert.id}`}
                className="grid grid-cols-1 gap-3 px-4 py-3 transition-colors hover:bg-panel-soft/60 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:px-5"
              >
                <div className="min-w-0">
                  <p className="tabular truncate text-sm font-semibold text-body">
                    {alert.id}
                  </p>
                  <p className="truncate text-[11px] text-dim">
                    {alert.atmId} · {alert.type} · {formatRelativeTime(alert.timestamp)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="tabular text-sm font-medium text-body">
                    {formatMwkCurrency(alert.amount)}
                  </p>
                  <p className="text-[11px] text-dim">Transaction amount</p>
                </div>

                <div className="min-w-0">
                  <ScoreBar score={alert.anomalyScore} risk={alert.risk} isAnomaly size="sm" />
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <RiskBadge risk={alert.risk} size="sm" />
                  <StatusBadge status={alert.status} map="anomaly" size="sm" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default RecentAlerts
