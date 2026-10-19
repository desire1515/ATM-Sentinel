import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PieChart } from 'lucide-react'
import ChartCard from '../common/ChartCard'
import { ChartLegend, ChartTooltip } from '../common/ChartTooltip'
import { CHART_AXIS_PROPS, CHART_COLORS } from '../../utils/constants'
import { formatNumber } from '../../utils/format'

const COLORS = {
  high: CHART_COLORS.risk,
  medium: CHART_COLORS.warn,
  low: CHART_COLORS.ok,
}

/**
 * Risk distribution chart.
 * This chart shows model risk levels assigned from anomaly-score quantiles.
 */
export function RiskDistributionChart({ data = [], loading = false, scope = 'all' }) {
  // Map risk -> count, handling both { risk, count } and { key, label, value } formats
  const countsMap = new Map()
  data.forEach((entry) => {
    const key = entry.key ?? entry.risk ?? entry.label
    const value = entry.value ?? entry.count ?? 0
    countsMap.set(key, (countsMap.get(key) || 0) + value)
  })
  const total = [...countsMap.values()].reduce((sum, value) => sum + value, 0)

  const ordered = ['high', 'medium', 'low', 'normal']
    .map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: countsMap.get(key) || 0,
    }))
    .filter((entry) => entry.value > 0 || scope === 'all')

  return (
    <ChartCard
      title="Risk Distribution"
      description={
        scope === 'flagged'
          ? "Isolation Forest flags grouped by model risk level."
          : "Synthetic observations grouped by model risk level."
      }
      icon={PieChart}
      loading={loading}
      isEmpty={!total}
      height={240}
      legend={
        <ChartLegend
          items={ordered.map((entry) => ({
            label: `${entry.label} · ${formatNumber(entry.value)}`,
            color: COLORS[entry.key] ?? CHART_COLORS.brand,
          }))}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={ordered}
          layout="vertical"
          margin={{ top: 4, right: 42, bottom: 4, left: 4 }}
          barSize={18}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="label" width={78} {...CHART_AXIS_PROPS} />
          <Tooltip
            cursor={{ fill: 'rgba(36, 52, 77, 0.35)' }}
            content={<ChartTooltip hideTotal valueFormatter={(value) => formatNumber(value)} />}
          />
          <Bar dataKey="value" name="Observations" radius={[0, 4, 4, 0]} isAnimationActive>
            <LabelList
              dataKey="value"
              position="right"
              className="tabular"
              fill={CHART_COLORS.axis}
              fontSize={11}
            />
            {ordered.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key] ?? CHART_COLORS.brand} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default RiskDistributionChart
