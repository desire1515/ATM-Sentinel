import { ShieldCheck } from 'lucide-react'
import { cn } from '../../utils/cn'
import { APP_META } from '../../utils/constants'

/**
 * Text + icon brand treatment.
 * Uses a Lucide shield glyph inside a bordered tile — no copyrighted logo asset
 * is used anywhere in this project.
 */
export function BrandLogo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/40 bg-brand/10 text-brand shadow-glow">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-ok pulse-dot"
        />
      </span>

      <span className={cn('min-w-0', compact && 'sr-only')}>
        <span className="block truncate text-sm font-extrabold tracking-[0.14em] text-body">
          {APP_META.name}
        </span>
        <span className="block truncate text-[11px] text-dim">{APP_META.subtitle}</span>
      </span>
    </div>
  )
}

export default BrandLogo
