import { cn } from '../../utils/cn'
import { formatNumber } from '../../utils/format'
import { CHART_COLORS } from '../../utils/constants'

/**
 * Custom Recharts tooltip.
 * Keeps chart tooltips consistent with the dark theme and lets each chart decide
 * how values are formatted.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = (value) => formatNumber(value),
  valueSuffix = '',
  hideTotal = false,
}) {
  if (!active || !payload?.length) return null

  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0)

  return (
    <div
      className="min-w-[150px] rounded-lg border border-hairline bg-ink/95 px-3 py-2 text-xs shadow-raised backdrop-blur"
      style={{ borderColor: CHART_COLORS.grid }}
    >
      <p className="mb-1.5 font-semibold text-body">
        {labelFormatter ? labelFormatter(label) : label}
      </p>

      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: entry.color ?? entry.payload?.fill ?? CHART_COLORS.brand }}
              />
              {entry.name}
            </span>
            <span className="tabular font-medium text-body">
              {valueFormatter(entry.value)}
              {valueSuffix}
            </span>
          </li>
        ))}
      </ul>

      {!hideTotal && payload.length > 1 ? (
        <p className="mt-1.5 flex items-center justify-between gap-4 border-t border-hairline pt-1.5 text-[11px] text-dim">
          <span>Total</span>
          <span className="tabular text-muted">
            {valueFormatter(total)}
            {valueSuffix}
          </span>
        </p>
      ) : null}
    </div>
  )
}

export function ChartLegend({ items, className }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: item.color ?? CHART_COLORS.brand }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export default ChartTooltip
