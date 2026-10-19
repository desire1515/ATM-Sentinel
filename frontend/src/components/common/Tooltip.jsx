import { Info } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Small "explain this metric" tooltip.
 * Rendered as a focusable element so keyboard users can read the same
 * explanation as mouse users (no hover-only information).
 */
export function Tooltip({ content, label = 'More information', className, children }) {
  return (
    <span className={cn('group relative inline-flex items-center', className)}>
      <button
        type="button"
        aria-label={label}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-hairline text-dim transition-colors hover:border-brand/50 hover:text-brand"
      >
        <Info className="h-2.5 w-2.5" aria-hidden="true" />
      </button>

      {children}

      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-lg border border-hairline bg-ink px-3 py-2 text-[11px] font-normal leading-4 text-muted opacity-0 shadow-raised transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}

export default Tooltip
