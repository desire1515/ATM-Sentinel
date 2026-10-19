import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/** Inline spinner + label used while a service request is in flight. */
export function LoadingState({ label = 'Loading dataset records…', className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted', className)}
    >
      <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/** Generic shimmer block. */
export function SkeletonBlock({ className, style }) {
  return <div className={cn('skeleton rounded-md', className)} style={style} aria-hidden="true" />
}

/** Table placeholder that mirrors the final row rhythm. */
export function TableSkeleton({ rows = 6, columns = 6, className }) {
  return (
    <div className={cn('space-y-2 p-4', className)} role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <SkeletonBlock
              key={columnIndex}
              className={cn('h-4', columnIndex === 0 ? 'w-28' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Chart placeholder sized to the chart it replaces (avoids layout shift). */
export function ChartSkeleton({ height = 280, className }) {
  return (
    <div
      className={cn('flex items-end gap-2 px-1', className)}
      style={{ height }}
      role="status"
      aria-label="Loading chart"
    >
      {[42, 68, 54, 80, 46, 72, 60, 88, 52, 66].map((value, index) => (
        <SkeletonBlock
          key={index}
          className="flex-1"
          // Height varies so the placeholder reads as a chart, not a row of bars.
          style={{ height: `${value}%` }}
        />
      ))}
    </div>
  )
}

export default LoadingState
