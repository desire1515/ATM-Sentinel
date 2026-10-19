import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../common/ChartCard'
import { ChartLegend, ChartTooltip } from '../common/ChartTooltip'
import { CHART_AXIS_PROPS, CHART_COLORS } from '../../utils/constants'
import { formatNumber } from '../../utils/format'

/**
 * Normal vs anomalous distribution across ordered buckets
 * (transaction-amount ranges, hours of day, anomaly-score ranges).
 */
export function DistributionChart({
  title,
  description,
  icon,
  data = [],
  xKey = 'label',
  height = 280,
  loading = false,
  note,
  compactTicks = false,
}) {
  const normalTotal = data.reduce((sum, entry) => sum + (entry.Normal ?? 0), 0)
  const anomalousTotal = data.reduce((sum, entry) => sum + (entry.Anomalous ?? 0), 0)

  return (
    <ChartCard
      title={title}
      description={description}
      icon={icon}
      loading={loading}
      isEmpty={normalTotal + anomalousTotal === 0}
      height={height}
      legend={
        <ChartLegend
          items={[
            { label: 'Normal', color: CHART_COLORS.ok },
            { label: 'Anomalous', color: CHART_COLORS.risk },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            {...CHART_AXIS_PROPS}
            interval={compactTicks ? 0 : 'preserveStartEnd'}
            angle={compactTicks ? -40 : 0}
            textAnchor={compactTicks ? 'end' : 'middle'}
            height={compactTicks ? 52 : 30}
          />
          <YAxis {...CHART_AXIS_PROPS} width={44} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'rgba(36, 52, 77, 0.35)' }}
            content={<ChartTooltip valueFormatter={(value) => formatNumber(value)} />}
          />
          <Bar
            dataKey="Normal"
            name="Normal"
            stackId="records"
            fill={CHART_COLORS.ok}
            fillOpacity={0.8}
          />
          <Bar
            dataKey="Anomalous"
            name="Anomalous"
            stackId="records"
            fill={CHART_COLORS.risk}
            fillOpacity={0.9}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {note ? <p className="mt-2 text-[11px] leading-5 text-dim">{note}</p> : null}
    </ChartCard>
  )
}

export default DistributionChart
