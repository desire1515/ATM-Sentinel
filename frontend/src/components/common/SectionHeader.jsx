import { cn } from '../../utils/cn'

/**
 * Page/section heading with optional actions.
 * `level` keeps the document outline sensible (one h1 per page).
 */
export function SectionHeader({
  title,
  description,
  eyebrow,
  actions,
  level = 2,
  id,
  className,
}) {
  const Heading = `h${level}`

  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        ) : null}
        <Heading id={id} className="text-lg font-semibold tracking-tight text-body sm:text-xl">
          {title}
        </Heading>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export default SectionHeader
