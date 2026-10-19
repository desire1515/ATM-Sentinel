import { Clock, MapPin, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskBadge from '../common/RiskBadge'
import { cn } from '../../utils/cn'
import { formatNumber, formatRelativeTime } from '../../utils/format'

/**
 * Single terminal summary card.
 * Risk is repeated as text + icon inside RiskBadge, never colour alone.
 */
export function AtmCard({ atm, selected = false, onSelect, className }) {
  if (!atm) return null

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-panel/80 p-4 transition-colors',
        selected ? 'border-brand/60 ring-1 ring-brand/25' : 'border-hairline hover:border-brand/35',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tabular text-xs font-semibold text-brand">{atm.id}</p>
          <p className="truncate text-sm font-semibold text-body">{atm.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-dim">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {atm.location}
          </p>
          <p className="mt-1 text-[10px] text-warn">{atm.locationStatus}</p>
        </div>
        <RiskBadge risk={atm.risk} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-hairline/70 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-dim">Transactions</p>
          <p className="tabular text-sm font-semibold text-body">
            {formatNumber(atm.transactionCount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-dim">Anomalies</p>
          <p className="tabular text-sm font-semibold text-warn">
            {formatNumber(atm.anomalyCount ?? atm.anomalies ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-dim">Flag rate</p>
          <p className="tabular text-sm font-semibold text-body">{atm.anomalyRate}%</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-dim">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatRelativeTime(atm.lastActivity)}
        </span>
        <span>{formatNumber(atm.transactionCount)} transactions</span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect?.(atm)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-panel-soft px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand/40 hover:text-brand"
        >
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          View findings
        </button>

        <Link
          to={`/transactions?q=${atm.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-dim transition-colors hover:text-body"
        >
          Transactions
        </Link>
      </div>
    </div>
  )
}

export default AtmCard
