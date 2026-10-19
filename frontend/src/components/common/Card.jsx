import { cn } from '../../utils/cn'

const PADDING = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
}

/**
 * Surface used by every panel in the dashboard.
 * `interactive` adds the subtle hover lift reserved for cards that navigate.
 */
export function Card({
  as: Component = 'section',
  padding = 'md',
  interactive = false,
  selected = false,
  className,
  children,
  ...rest
}) {
  return (
    <Component
      className={cn(
        'rounded-xl border bg-panel/90 shadow-panel backdrop-blur-[2px]',
        'border-hairline',
        selected && 'border-brand/60 ring-1 ring-brand/30',
        interactive &&
          'transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-raised',
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}

/** Header row for a Card: title, optional description, optional actions. */
export function CardHeader({ title, description, actions, icon: Icon, className, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`

  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-panel-soft text-brand">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}

        <div className="min-w-0">
          <Heading className="truncate text-sm font-semibold tracking-wide text-body">{title}</Heading>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
          ) : null}
        </div>
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export default Card
