import { Radio } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Card, CardHeader } from '../common/Card'
import { CHART_COLORS } from '../../utils/constants'
import { formatNumber } from '../../utils/format'

const RISK_COLOR = {
  High: CHART_COLORS.risk,
  Medium: CHART_COLORS.warn,
  Low: CHART_COLORS.ok,
  Normal: CHART_COLORS.axis,
}

const RISK_LABEL = {
  High: 'High risk',
  Medium: 'Medium risk',
  Low: 'Low risk',
  Normal: 'Normal',
}

/**
 * Network overview.
 *
 * Nodes use generated coordinates in a schematic network layout; positions do
 * not indicate verified ATM installations.
 */
export function AtmNetworkMap({ atms = [], selectedId, onSelect, loading = false }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Synthetic Malawi ATM coordinate plot"
        description="Simulated coordinates from the generated transaction dataset, colored by model risk. These are not verified ATM installations."
        icon={Radio}
      />

      <div className="relative mt-4 min-h-[300px] flex-1 overflow-hidden rounded-xl border border-hairline bg-ink-soft/60">
        {/* link lines */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="link-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity="0.35" />
              <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {atms.map((atm) => (
            <line
              key={atm.id}
              x1="50"
              y1="50"
              x2={atm.node?.x ?? 50}
              y2={atm.node?.y ?? 50}
              stroke="url(#link-gradient)"
              strokeWidth="0.35"
              strokeDasharray="2 2"
            />
          ))}
        </svg>

        {/* central hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand/50 bg-brand/10 text-brand shadow-glow">
              <Radio className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="mt-1 rounded-full border border-hairline bg-ink/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
              CSV dataset
            </span>
          </div>
        </div>

        {/* terminal nodes */}
        {atms.map((atm) => {
          const color = RISK_COLOR[atm.risk] ?? CHART_COLORS.axis
          const selected = atm.id === selectedId

          return (
            <button
              key={atm.id}
              type="button"
              onClick={() => onSelect?.(atm)}
              title={`${atm.id} — ${atm.name} (${RISK_LABEL[atm.risk] ?? atm.risk})`}
              aria-label={`${atm.id}, ${atm.name}, highest risk ${RISK_LABEL[atm.risk] ?? atm.risk}, ${formatNumber(atm.anomalyCount ?? atm.anomalies ?? 0)} anomalies`}
              aria-pressed={selected}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-ink/90 px-1.5 py-1 text-left transition-transform duration-150 hover:scale-105',
                selected ? 'border-brand/70 ring-1 ring-brand/40' : 'border-hairline',
              )}
              style={{ left: `${atm.node?.x ?? 50}%`, top: `${atm.node?.y ?? 50}%` }}
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="tabular text-[10px] font-semibold text-body">{atm.id}</span>
              </span>
              <span className="tabular mt-0.5 block pl-3.5 text-[9px] text-dim">
                {formatNumber(atm.anomalyCount ?? atm.anomalies ?? 0)} anom.
              </span>
            </button>
          )
        })}

        {!loading && atms.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-muted">
            No terminals to display.
          </p>
        ) : null}
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {Object.entries(RISK_LABEL).map(([key, label]) => (
          <li key={key} className="flex items-center gap-1.5 text-[11px] text-muted">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: RISK_COLOR[key] }}
            />
            {label}
          </li>
        ))}
        <li className="text-[11px] text-dim">· Schematic only; coordinates are simulated</li>
      </ul>
    </Card>
  )
}

export default AtmNetworkMap
