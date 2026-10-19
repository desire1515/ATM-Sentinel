import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import ChartCard from '../common/ChartCard'
import { ChartLegend, ChartTooltip } from '../common/ChartTooltip'
import { CHART_COLORS } from '../../utils/constants'
import { formatNumber, formatPercent } from '../../utils/format'

const COLORS = {
  normal: CHART_COLORS.ok,
  anomalous: CHART_COLORS.risk,
}

/**
 * Normal vs anomalous distribution (donut).
 * The centre label carries the anomaly rate so the chart has a numeric anchor,
 * and the legend repeats the counts for screen readers.
 */
export function AnomalyDistributionChart({ data = [], loading = false }) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0)
  const anomalous = data.find((entry) => entry.key === 'anomalous')?.value ?? 0
  const rate = total ? (anomalous / total) * 100 : 0

  return (
    <ChartCard
      title="Model Prediction Distribution"
      description="Share of synthetic transactions flagged by the precomputed Isolation Forest model."
      icon={PieIcon}
      loading={loading}
      isEmpty={!total}
      height={300}
      legend={
        <ChartLegend
          items={data.map((entry) => ({
            label: `${entry.label} · ${formatNumber(entry.value)}`,
            color: COLORS[entry.key] ?? CHART_COLORS.brand,
          }))}
        />
      }
    >
      <div className="relative h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(value) => formatNumber(value)}
                  hideTotal
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke={CHART_COLORS.tooltipBg}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key] ?? CHART_COLORS.brand} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">
            Anomaly rate
          </span>
          <span className="tabular text-xl font-bold text-body">{formatPercent(rate, { decimals: 2 })}</span>
          <span className="text-[10px] text-dim">          dataset</span>
        </div>
      </div>
    </ChartCard>
  )
}

export default AnomalyDistributionChart
