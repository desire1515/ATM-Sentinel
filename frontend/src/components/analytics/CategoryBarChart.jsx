import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartCard from '../common/ChartCard'
import { ChartTooltip } from '../common/ChartTooltip'
import { CHART_AXIS_PROPS, CHART_COLORS } from '../../utils/constants'
import { formatNumber } from '../../utils/format'

/**
 * Generic horizontal category bar chart.
 * Horizontal orientation keeps long terminal/branch labels readable on mobile.
 */
export function CategoryBarChart({
  title,
  description,
  icon,
  data = [],
  dataKey = 'anomalies',
  labelKey = 'label',
  color = CHART_COLORS.warn,
  height = 300,
  loading = false,
  seriesKeys,
  valueFormatter = (value) => formatNumber(value),
}) {
  const keys = seriesKeys ?? [dataKey]

  const stackColors = {
    high: CHART_COLORS.risk,
    medium: CHART_COLORS.warn,
    low: CHART_COLORS.ok,
    [dataKey]: color,
  }

  return (
    <ChartCard
      title={title}
      description={description}
      icon={icon}
      loading={loading}
      isEmpty={!data.length}
      height={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
          barSize={keys.length > 1 ? 12 : 16}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...CHART_AXIS_PROPS} allowDecimals={false} />
          <YAxis type="category" dataKey={labelKey} width={104} {...CHART_AXIS_PROPS} />
          <Tooltip
            cursor={{ fill: 'rgba(36, 52, 77, 0.35)' }}
            content={<ChartTooltip valueFormatter={valueFormatter} />}
          />
          {keys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              name={key.charAt(0).toUpperCase() + key.slice(1)}
              stackId={keys.length > 1 ? 'risk' : undefined}
              radius={[0, 4, 4, 0]}
              fill={stackColors[key] ?? color}
            >
              {stackColors[key] ? data.map((entry, index) => (
                <Cell key={`${key}-${index}`} fill={stackColors[key]} />
              )) : null}
              {keys.length === 1 ? (
                <LabelList
                  dataKey={key}
                  position="right"
                  fill={CHART_COLORS.axis}
                  fontSize={11}
                />
              ) : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default CategoryBarChart
