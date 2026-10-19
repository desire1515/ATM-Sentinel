import { ArrowRight, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskBadge from '../common/RiskBadge'
import StatusBadge from '../common/StatusBadge'
import ScoreBar from '../common/ScoreBar'
import { Badge } from '../common/Badge'
import { formatMwkCurrency, formatRelativeTime } from '../../utils/format'

/**
 * Compact anomaly summary card.
 * Used for related findings on the investigation page and in narrow layouts
 * where a wide table would not fit.
 */
export function AnomalyCard({ anomaly, className }) {
  if (!anomaly) return null

  return (
    <Link
      to={`/anomalies/${anomaly.id}`}
      className={`flex flex-col gap-3 rounded-xl border border-hairline bg-panel/80 p-4 transition-colors hover:border-brand/40 hover:bg-panel-soft/70 ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tabular truncate text-sm font-semibold text-body">{anomaly.id}</p>
          <p className="truncate text-[11px] text-dim">
            {anomaly.atmId} · {anomaly.atmCity}
          </p>
        </div>
        <RiskBadge risk={anomaly.risk} size="sm" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="tabular font-semibold text-body">
          {formatMwkCurrency(anomaly.amount)}
        </span>
        <span>{anomaly.type}</span>
        <span>{formatRelativeTime(anomaly.timestamp)}</span>
      </div>

      <ScoreBar score={anomaly.anomalyScore} risk={anomaly.risk} isAnomaly={anomaly.isAnomaly} size="sm" />
      <p className="text-[11px] text-dim">
        Synthetic Malawi location: {anomaly.location}. Not a verified ATM installation.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <StatusBadge status={anomaly.detectionStatus} map="anomaly" size="sm" />
          <Badge tone="dim" size="sm" icon={TriangleAlert}>Model result</Badge>
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand">
          Investigate
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

export default AnomalyCard
