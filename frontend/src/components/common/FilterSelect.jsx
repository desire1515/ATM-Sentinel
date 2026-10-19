import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Labelled native <select>.
 * A native control is used deliberately: it is keyboard accessible, works with
 * screen readers and behaves correctly on mobile without extra scripting.
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options = [],
  hideLabel = false,
  size = 'md',
  className,
  selectClassName,
  ...rest
}) {
  const id = useId()

  return (
    <div className={cn('w-full min-w-0', className)}>
      <label
        htmlFor={id}
        className={cn(
          'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'w-full appearance-none rounded-lg border border-hairline bg-panel-soft text-sm text-body',
            'focus:border-brand/60 focus:outline-none',
            size === 'sm' ? 'h-8 pl-2.5 pr-8 text-xs' : 'h-9 pl-3 pr-9',
            selectClassName,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-panel text-body">
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-dim',
            size === 'sm' ? 'right-2 h-3.5 w-3.5' : 'right-3 h-4 w-4',
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export default FilterSelect
