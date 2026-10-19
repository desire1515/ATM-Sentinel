import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartCard from '../common/ChartCard'
import { ChartLegend, ChartTooltip } from '../common/ChartTooltip'
import { CHART_AXIS_PROPS, CHART_COLORS } from '../../utils/constants'
import { formatCompactNumber, formatNumber } from '../../utils/format'
import { Activity } from 'lucide-react'

/**
 * Synthetic ATM transaction volume over time.
 * Observation volume is drawn as an area against the left axis; anomalies as a
 * line against a second axis so the anomaly counts stay readable.
 */
export function TransactionActivityChart({ data = [], loading = false }) {
  const isEmpty = !data.length

  return (
    <ChartCard
      title="ATM Observation Activity"
      description="Synthetic transaction volume and Isolation Forest anomaly flags per day."
      icon={Activity}
      loading={loading}
      isEmpty={isEmpty}
      height={300}
      legend={
        <ChartLegend
          items={[
            { label: 'Transactions', color: CHART_COLORS.brand },
            { label: 'Anomalies', color: CHART_COLORS.risk },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="sentinel-activity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.42} />
              <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...CHART_AXIS_PROPS} minTickGap={16} />
          <YAxis
            yAxisId="volume"
            {...CHART_AXIS_PROPS}
            width={54}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <YAxis
            yAxisId="anomalies"
            orientation="right"
            {...CHART_AXIS_PROPS}
            width={34}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.brand, strokeOpacity: 0.25 }}
            content={
              <ChartTooltip valueFormatter={(value) => formatNumber(value)} hideTotal />
            }
          />

          <Area
            yAxisId="volume"
            type="monotone"
            dataKey="observations"
            name="Transactions"
            stroke={CHART_COLORS.brand}
            strokeWidth={2}
            fill="url(#sentinel-activity)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            yAxisId="anomalies"
            type="monotone"
            dataKey="anomalies"
            name="Anomalies"
            stroke={CHART_COLORS.risk}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default TransactionActivityChart
