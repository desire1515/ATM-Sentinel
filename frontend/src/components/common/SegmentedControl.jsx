import { cn } from '../../utils/cn'

/**
 * Compact option switcher (period selection, table/grid view modes).
 * Uses aria-pressed toggles so the state is announced to screen readers.
 */
export function SegmentedControl({ options, value, onChange, ariaLabel, size = 'md', className }) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-hairline bg-panel-soft p-1 scroll-area',
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const Icon = option.icon
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-xs sm:text-sm',
              active
                ? 'bg-brand/15 text-brand shadow-[inset_0_0_0_1px_rgba(14,165,233,0.35)]'
                : 'text-muted hover:bg-panel hover:text-body',
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
