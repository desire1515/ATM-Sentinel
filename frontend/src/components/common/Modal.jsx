import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Centred modal dialog.
 * Used for short, informational interactions (for example the "export is not
 * enabled yet" notice on the Reports page).
 */
export function Modal({ open, onClose, title, description, children, footer, className }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'fade-in relative w-full max-w-lg rounded-xl border border-hairline bg-panel p-5 shadow-raised',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-body">
              {title}
            </h2>
            {description ? <p className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-panel-soft text-muted transition-colors hover:text-body"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {children ? <div className="mt-4 text-sm leading-6 text-muted">{children}</div> : null}
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}

export default Modal
