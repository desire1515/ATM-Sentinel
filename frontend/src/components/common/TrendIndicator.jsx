import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatPercent } from '../../utils/format'

const ICONS = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
}

/**
 * Period-over-period trend chip.
 * `tone` decides the colour because a rising value is good for normal traffic but
 * bad for anomalies — direction alone must not imply sentiment.
 */
export function TrendIndicator({
  direction = 'flat',
  value,
  label,
  tone = 'dim',
  className,
}) {
  const Icon = ICONS[direction] ?? Minus

  const toneClasses = {
    ok: 'text-ok',
    risk: 'text-risk',
    warn: 'text-warn',
    brand: 'text-brand',
    dim: 'text-muted',
  }[tone] ?? 'text-muted'

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', toneClasses, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {Number.isFinite(Number(value)) ? (
        <span className="tabular">{formatPercent(value, { decimals: 1, withSign: direction === 'up' })}</span>
      ) : null}
      {label ? <span className="font-normal text-dim">{label}</span> : null}
    </span>
  )
}

export default TrendIndicator
