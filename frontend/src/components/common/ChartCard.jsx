import { cn } from '../../utils/cn'
import { Card, CardHeader } from './Card'
import { ChartSkeleton } from './LoadingState'
import { EmptyState } from './EmptyState'

/**
 * Chart panel wrapper.
 * Owns the title, legend, loading skeleton, empty state and height so every chart
 * on the dashboard has identical spacing and responsive behaviour.
 */
export function ChartCard({
  title,
  description,
  icon,
  actions,
  legend,
  loading = false,
  isEmpty = false,
  emptyState,
  height = 280,
  padding = 'md',
  className,
  children,
}) {
  return (
    <Card padding={padding} className={cn('flex h-full flex-col', className)}>
      <CardHeader title={title} description={description} icon={icon} actions={actions} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {loading ? (
          <ChartSkeleton height={height} />
        ) : isEmpty ? (
          emptyState ?? (
            <EmptyState
              title="No anomalous transactions found."
              description="Adjust the filters above or widen the reporting period to see results."
              compact
            />
          )
        ) : (
          <div style={{ width: '100%', height }}>{children}</div>
        )}
      </div>

      {legend ? <div className="mt-3 border-t border-hairline/70 pt-3">{legend}</div> : null}
    </Card>
  )
}

export default ChartCard
