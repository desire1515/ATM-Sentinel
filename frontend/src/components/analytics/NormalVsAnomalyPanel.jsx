import { Scale } from 'lucide-react'
import { Card, CardHeader } from '../common/Card'
import { ChartLegend } from '../common/ChartTooltip'
import { CHART_COLORS } from '../../utils/constants'
import { formatNumber, formatPercent } from '../../utils/format'

const FORMATTERS = {
  percent: (value) => formatPercent(value, { decimals: 1 }),
  count: (value) => formatNumber(value),
}

/**
 * Model-classified normal and anomalous transaction comparison.
 * Values are shown as aligned bars per metric with their respective units.
 */
export function NormalVsAnomalyPanel({ rows = [], loading = false }) {
  const maxByRow = rows
    .filter((row) => row.unit !== 'count')
    .map((row) => Math.max(Number(row.Normal) || 0, Number(row.Anomalous) || 0))

  const globalMax = maxByRow.length ? Math.max(...maxByRow) : 1

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Normal vs review-flagged comparison"
        description="Descriptive comparison of transactions classified as normal or anomalous by Isolation Forest."
        icon={Scale}
      />

      <div className="mt-4 space-y-4">
        {rows.map((row) => {
          const format = FORMATTERS[row.unit] ?? FORMATTERS.count
          const scaleMax = row.unit === 'count' ? null : globalMax

          const width = (value) =>
            scaleMax ? `${Math.min((Number(value) / scaleMax) * 100, 100)}%` : '100%'

          return (
            <div key={row.metric}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-body">{row.metric}</p>
                <p className="tabular text-[11px] text-dim">{row.unit}</p>
              </div>

              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-ok">
                    Normal
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-soft">
                    <span
                      className="block h-full rounded-full bg-ok"
                      style={{ width: loading ? '0%' : width(row.Normal) }}
                    />
                  </span>
                  <span className="tabular w-24 shrink-0 text-right text-[11px] text-body">
                    {loading ? '—' : format(row.Normal)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-risk">
                    Flagged
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-soft">
                    <span
                      className="block h-full rounded-full bg-risk"
                      style={{ width: loading ? '0%' : width(row.Anomalous) }}
                    />
                  </span>
                  <span className="tabular w-24 shrink-0 text-right text-[11px] text-body">
                    {loading ? '—' : format(row.Anomalous)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-auto space-y-2 border-t border-hairline/70 pt-4">
        <ChartLegend
          items={[
            { label: 'Model classified normal', color: CHART_COLORS.ok },
            { label: 'Flagged for review', color: CHART_COLORS.risk },
          ]}
        />
        <p className="text-[11px] leading-5 text-dim">
          These are descriptive statistics from the synthetic demonstration records, not fraud findings
          or trained-model performance metrics.
        </p>
      </div>
    </Card>
  )
}

export default NormalVsAnomalyPanel
