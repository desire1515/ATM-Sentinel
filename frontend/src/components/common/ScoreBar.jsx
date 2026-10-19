import { cn } from '../../utils/cn'
import { formatScore } from '../../utils/format'

const BANDS = {
  high: 'bg-risk',
  medium: 'bg-warn',
  low: 'bg-ok',
}

/**
 * Shows the raw model decision score and its separate binary classification.
 */
export function ScoreBar({
  score,
  risk = 'low',
  isAnomaly = false,
  showValue = true,
  size = 'md',
  className,
}) {
  const numeric = Number(score)
  const height = size === 'sm' ? 'h-1.5' : 'h-2'
  const result = isAnomaly ? 'Anomaly' : 'Normal'

  return (
    <div className={cn('flex min-w-[110px] flex-col gap-1.5', className)}>
      {showValue ? (
        <div className="flex items-baseline justify-between gap-2">
          <span className="tabular text-xs font-semibold text-body">
            {formatScore(numeric, 6)}
          </span>
          <span className="text-[10px] text-dim">Model score</span>
        </div>
      ) : null}

      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-panel-soft', height)}
        role="img"
        aria-label={`Isolation Forest classification: ${result}; anomaly score ${formatScore(numeric, 6)}`}
      >
        <span
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500',
            BANDS[String(risk).toLowerCase()] ?? BANDS.low,
          )}
          style={{ width: isAnomaly ? '100%' : '0%' }}
        />
      </div>
    </div>
  )
}

export default ScoreBar
