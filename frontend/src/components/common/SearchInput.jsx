import { useId } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Search box with a visible-only-when-needed clear button.
 * The label is always associated with the input, even when visually hidden.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  hideLabel = true,
  className,
  inputClassName,
  onSubmit,
  ...rest
}) {
  const id = useId()

  return (
    <div className={cn('w-full', className)}>
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
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim"
          aria-hidden="true"
        />

        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && onSubmit) onSubmit(value)
          }}
          placeholder={placeholder}
          className={cn(
            'h-9 w-full rounded-lg border border-hairline bg-panel-soft pl-9 pr-9 text-sm text-body',
            'placeholder:text-dim focus:border-brand/60 focus:outline-none',
            '[&::-webkit-search-cancel-button]:hidden',
            inputClassName,
          )}
          {...rest}
        />

        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-dim transition-colors hover:bg-panel hover:text-body"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default SearchInput
