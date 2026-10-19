import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import ChartCard from '../common/ChartCard'
import { ChartLegend, ChartTooltip } from '../common/ChartTooltip'
import { CHART_AXIS_PROPS, CHART_COLORS } from '../../utils/constants'
import { formatNumber } from '../../utils/format'

/**
 * Anomaly trend chart.
 * Shows model-flagged synthetic transactions grouped by transaction hour.
 * The dataset covers a fixed historical window, so no browser-clock
 * comparisons are used.
 */
export function AnomalyTrendChart({ data = [], loading = false }) {
  const totalAnomalies = data.reduce((sum, entry) => sum + entry.anomalies, 0)

  return (
    <ChartCard
      title="Model-Flagged Anomalies by Hour"
      description={
        data.length > 0
          ? "Hourly count of transactions flagged by the precomputed Isolation Forest model."
          : "No model anomalies to display."
      }
      icon={TrendingUp}
      loading={loading}
      isEmpty={!data.length}
      height={300}
      legend={
        <ChartLegend
          items={[
            { label: 'Flagged anomalies', color: CHART_COLORS.warn },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="sentinel-anomaly-trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.warn} stopOpacity={0.42} />
              <stop offset="100%" stopColor={CHART_COLORS.warn} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...CHART_AXIS_PROPS} minTickGap={16} />
          <YAxis {...CHART_AXIS_PROPS} width={38} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.warn, strokeOpacity: 0.25 }}
            content={
              <ChartTooltip
                hideTotal
                valueFormatter={(value) => formatNumber(value)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="anomalies"
            name="Flagged anomalies"
            stroke={CHART_COLORS.warn}
            strokeWidth={2}
            fill="url(#sentinel-anomaly-trend)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {data.length > 0 ? (
        <p className="mt-2 text-[11px] text-dim">
          Total model anomalies across the dataset window:{' '}
          <span className="tabular font-semibold text-body">
            {formatNumber(totalAnomalies)}
          </span>
        </p>
      ) : null}
    </ChartCard>
  )
}

export default AnomalyTrendChart
