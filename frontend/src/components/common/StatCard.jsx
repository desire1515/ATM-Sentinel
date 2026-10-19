import { cn } from '../../utils/cn'
import { TrendIndicator } from './TrendIndicator'

const TONES = {
  brand: { chip: 'border-brand/40 bg-brand/10 text-brand', bar: 'from-brand/70 to-brand/0' },
  ok: { chip: 'border-ok/40 bg-ok/10 text-ok', bar: 'from-ok/70 to-ok/0' },
  warn: { chip: 'border-warn/40 bg-warn/10 text-warn', bar: 'from-warn/70 to-warn/0' },
  risk: { chip: 'border-risk/40 bg-risk/10 text-risk', bar: 'from-risk/70 to-risk/0' },
}

/**
 * KPI tile.
 * Renders a skeleton while data is loading so the dashboard never jumps.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  trend,
  loading = false,
  badge,
  footer,
  className,
}) {
  const palette = TONES[tone] ?? TONES.brand

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-hairline bg-panel/90 p-4 sm:p-5', className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-9 w-9 rounded-lg" />
        </div>
        <div className="skeleton mt-4 h-7 w-28 rounded" />
        <div className="skeleton mt-3 h-3 w-32 rounded" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-hairline bg-panel/90 p-4 shadow-panel transition-colors duration-200 hover:border-brand/30 sm:p-5',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r', palette.bar)}
      />

      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>

        <span className="flex items-center gap-2">
          {badge}
          {Icon ? (
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', palette.chip)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
        </span>
      </div>

      <p className="tabular mt-3 text-2xl font-bold leading-none text-body sm:text-[26px]">{value}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {trend ? <TrendIndicator {...trend} /> : null}
        {hint ? <p className="text-xs leading-5 text-dim">{hint}</p> : null}
      </div>

      {footer ? <div className="mt-3 border-t border-hairline/70 pt-3">{footer}</div> : null}
    </div>
  )
}

export default StatCard
