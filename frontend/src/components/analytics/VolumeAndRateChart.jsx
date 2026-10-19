import {
  Bar,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity } from 'lucide-react'
import ChartCard from '../common/ChartCard'
import { ChartLegend, ChartTooltip } from '../common/ChartTooltip'
import { CHART_AXIS_PROPS, CHART_COLORS } from '../../utils/constants'
import { formatNumber, formatPercent } from '../../utils/format'

/**
 * Transaction volume (bars, left axis) with the anomaly rate (line, right axis).
 * Combining both series answers "is volume driving the anomaly count?" at a glance.
 */
export function VolumeAndRateChart({ data = [], loading = false, height = 300 }) {
  return (
    <ChartCard
      title="Transaction volume & anomaly rate"
      description="Daily synthetic transaction volume and the share flagged as anomalous."
      icon={Activity}
      loading={loading}
      isEmpty={!data.length}
      height={height}
      legend={
        <ChartLegend
          items={[
            { label: 'Transactions', color: CHART_COLORS.brand },
            { label: 'Anomaly rate (%)', color: CHART_COLORS.warn },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...CHART_AXIS_PROPS} minTickGap={14} />
          <YAxis
            yAxisId="volume"
            {...CHART_AXIS_PROPS}
            width={48}
            tickFormatter={(value) => formatNumber(value)}
          />
          <YAxis
            yAxisId="rate"
            orientation="right"
            {...CHART_AXIS_PROPS}
            width={38}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(36, 52, 77, 0.35)' }}
            content={<ChartTooltip valueFormatter={(value) => formatNumber(value)} hideTotal />}
          />
          <Bar
            yAxisId="volume"
            dataKey="transactions"
            name="Transactions"
            fill={CHART_COLORS.brand}
            radius={[3, 3, 0, 0]}
            maxBarSize={26}
            fillOpacity={0.7}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="anomalyRate"
            name="Anomaly rate"
            stroke={CHART_COLORS.warn}
            strokeWidth={2}
            dot={{ r: 2, strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <p className="mt-2 text-[11px] text-dim">
        Avg. daily volume:{' '}
        {formatNumber(
          data.length
            ? data.reduce((sum, entry) => sum + entry.transactions, 0) / data.length
            : 0,
        )}{' '}
        · Avg. anomaly rate:{' '}
        {formatPercent(
          data.length
            ? data.reduce((sum, entry) => sum + entry.anomalyRate, 0) / data.length
            : 0,
          { decimals: 2 },
        )}
      </p>
    </ChartCard>
  )
}

export default VolumeAndRateChart
