import { cn } from '../../utils/cn'
import { formatScore } from '../../utils/format'

const ARC_LENGTH = Math.PI * 50

const STROKE = {
  high: 'var(--color-risk)',
  medium: 'var(--color-warn)',
  low: 'var(--color-ok)',
}

export function AnomalyScore({
  score = 0,
  risk = 'low',
  label = 'Isolation Forest anomaly score',
  isAnomaly = false,
  describe = true,
  className,
}) {
  const numeric = Number(score)
  const dash = isAnomaly ? ARC_LENGTH : 0
  const color = STROKE[String(risk).toLowerCase()] ?? STROKE.low

  return (
    <figure className={cn('flex flex-col items-center', className)}>
      <svg
        viewBox="0 0 120 72"
        className="h-[92px] w-full max-w-[210px]"
        role="img"
        aria-label={`Isolation Forest classified this transaction as ${isAnomaly ? 'anomaly' : 'normal'} with anomaly score ${formatScore(numeric, 6)}`}
      >
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="var(--color-panel-soft)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${ARC_LENGTH}`}
        />
      </svg>

      <figcaption className="mt-1 flex flex-col items-center">
        <span className="tabular text-2xl font-bold leading-none text-body">
          {formatScore(numeric, 4)}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">
          {label}
        </span>
        {describe ? (
          <span className="mt-1 text-[11px] text-muted">
            {isAnomaly ? 'Flagged as anomalous' : 'Classified as normal'} · score is not a probability
          </span>
        ) : null}
      </figcaption>
    </figure>
  )
}

export default AnomalyScore
