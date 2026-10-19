import { cn } from '../../utils/cn'

const TONES = {
  brand: 'border-brand/40 bg-brand/10 text-brand',
  ok: 'border-ok/40 bg-ok/10 text-ok',
  warn: 'border-warn/40 bg-warn/10 text-warn',
  risk: 'border-risk/40 bg-risk/10 text-risk',
  violet: 'border-violet/40 bg-violet/10 text-violet',
  dim: 'border-hairline bg-panel-soft text-muted',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
}

/**
 * Generic status chip.
 * `icon` is required by convention for status chips so meaning is never carried
 * by colour alone (accessibility requirement).
 */
export function Badge({ tone = 'dim', size = 'md', icon: Icon, className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border font-medium',
        TONES[tone] ?? TONES.dim,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}

export default Badge
