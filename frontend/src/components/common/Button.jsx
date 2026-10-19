import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

const VARIANTS = {
  primary:
    'border-brand/50 bg-brand/15 text-brand hover:bg-brand/25 hover:border-brand/70 focus-visible:outline-brand',
  secondary:
    'border-hairline bg-panel-soft text-body hover:border-brand/40 hover:text-brand',
  ghost: 'border-transparent bg-transparent text-muted hover:bg-panel-soft hover:text-body',
  danger: 'border-risk/50 bg-risk/15 text-risk hover:bg-risk/25',
  success: 'border-ok/50 bg-ok/15 text-ok hover:bg-ok/25',
}

const SIZES = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
}

/**
 * Single button primitive for the whole app.
 * Renders a <button>, a router <Link> (`to`) or an anchor (`href`) while keeping
 * identical styling, focus behaviour and disabled semantics.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  to,
  href,
  type = 'button',
  className,
  children,
  ...rest
}) {
  const classes = cn(
    'inline-flex select-none items-center justify-center rounded-lg border font-medium transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant] ?? VARIANTS.secondary,
    SIZES[size] ?? SIZES.md,
    className,
  )

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children ? <span className="truncate">{children}</span> : null}
      {IconRight ? <IconRight className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
    </>
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  if (href && !disabled) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
}

export default Button
