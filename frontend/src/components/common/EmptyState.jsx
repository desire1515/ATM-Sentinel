import { Inbox } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Professional empty state — used whenever a filter combination returns nothing
 * instead of leaving the panel blank.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing to display',
  description,
  action,
  compact = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-panel-soft/40 text-center',
        compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12',
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-panel text-dim">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-body">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-xs leading-5 text-muted">{description}</p>
        ) : null}
      </div>

      {action}
    </div>
  )
}

export default EmptyState
