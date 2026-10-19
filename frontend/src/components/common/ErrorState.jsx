import { OctagonAlert, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

/**
 * Error state. Displays a human-readable reason plus the technical detail so a
 * failed request never produces a blank screen.
 */
export function ErrorState({
  title = 'Unable to load this data',
  description = 'The data source could not be read. Try again, or continue with the rest of the dashboard.',
  detail,
  onRetry,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-risk/30 bg-risk/5 p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-risk/40 bg-risk/10 text-risk">
          <OctagonAlert className="h-4 w-4" aria-hidden="true" />
        </span>

        <div>
          <p className="text-sm font-semibold text-body">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
          {detail ? <p className="mt-1 text-[11px] text-dim">Details: {detail}</p> : null}
        </div>
      </div>

      {onRetry ? (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export default ErrorState
