import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Right-hand slide-over panel.
 * Used for the transaction detail view (all breakpoints) and the mobile
 * navigation drawer. Closes on overlay click, Escape key, or the close button.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  eyebrow,
  children,
  footer,
  side = 'right',
  size = 'max-w-xl',
  bodyClassName,
  className,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex" role="presentation">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : 'Details panel'}
        aria-labelledby={title ? 'drawer-title' : undefined}
        className={cn(
          'slide-in-right relative ml-auto flex h-full w-full flex-col border-hairline bg-ink-soft shadow-raised',
          side === 'right' ? 'border-l' : 'border-r',
          size,
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-4 sm:px-5">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 id="drawer-title" className="truncate text-base font-semibold text-body sm:text-lg">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-panel-soft text-muted transition-colors hover:text-body"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className={cn('scroll-area flex-1 overflow-y-auto px-4 py-4 sm:px-5', bodyClassName)}>{children}</div>

        {footer ? (
          <footer className="border-t border-hairline px-4 py-3 sm:px-5">{footer}</footer>
        ) : null}
      </div>
    </div>
  )
}

export default Drawer
