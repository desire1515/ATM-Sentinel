import { useId } from 'react'
import { cn } from '../../utils/cn'

/**
 * Accessible switch used by the Settings page.
 * Rendered as a real checkbox so keyboard and screen-reader behaviour is native.
 */
export function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  lockedReason,
  className,
}) {
  const id = useId()

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-lg border border-hairline bg-panel-soft/40 p-3.5',
        disabled && 'opacity-70',
        className,
      )}
    >
      <div className="min-w-0">
        <label htmlFor={id} className="block text-xs font-semibold text-body">
          {label}
        </label>
        {description ? (
          <p className="mt-1 text-[11px] leading-5 text-muted">{description}</p>
        ) : null}
        {lockedReason ? (
          <p className="mt-1 text-[11px] leading-5 text-dim">{lockedReason}</p>
        ) : null}
      </div>

      <label htmlFor={id} className="relative mt-0.5 shrink-0 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
          className="peer sr-only"
        />

        <span
          aria-hidden="true"
          className={cn(
            'block h-5 w-9 rounded-full border transition-colors duration-200',
            checked ? 'border-brand/60 bg-brand/40' : 'border-hairline bg-panel',
            !disabled && 'peer-focus-visible:ring-2 peer-focus-visible:ring-brand/60',
          )}
        >
          <span
            className={cn(
              'mt-[1px] block h-4 w-4 rounded-full bg-body shadow transition-transform duration-200',
              checked ? 'translate-x-[18px]' : 'translate-x-[1px]',
            )}
          />
        </span>
      </label>
    </div>
  )
}

export default Toggle
