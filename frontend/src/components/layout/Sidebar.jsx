import { NavLink } from 'react-router-dom'
import { Activity, ShieldCheck } from 'lucide-react'
import { cn } from '../../utils/cn'
import { APP_META, NAV_ITEMS } from '../../utils/constants'
import { useServiceQuery } from '../../hooks/useServiceQuery'
import { anomalyService } from '../../services'
import BrandLogo from './BrandLogo'

function NavItem({ item, badge }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-brand/10 text-brand'
            : 'text-muted hover:bg-panel-soft hover:text-body',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-colors',
              isActive ? 'bg-brand' : 'bg-transparent',
            )}
          />
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {badge ? (
            <span className="tabular rounded-full border border-risk/40 bg-risk/10 px-1.5 py-0.5 text-[10px] font-semibold text-risk">
              {badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

/**
 * Persistent desktop sidebar with presentation navigation and live
 * system status.
 */
export function Sidebar({ onNavigate, className, widthClass = 'w-72' }) {
  const { data } = useServiceQuery(() => anomalyService.fetchAnomalies())
  const flaggedCount = data?.summary?.flagged ?? null

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-hairline bg-ink-soft/95',
        widthClass,
        className,
      )}
      aria-label="Primary navigation"
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-4">
        <BrandLogo />
      </div>

      <nav className="scroll-area flex-1 overflow-y-auto px-3 py-4" onClick={onNavigate}>
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-dim">
          Monitoring
        </p>

        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavItem
                item={item}
                badge={item.to === '/anomalies' && flaggedCount ? flaggedCount : null}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-hairline px-4 py-4">
        <div className="rounded-lg border border-hairline bg-panel/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-dim">Operating mode</p>

          <p className="mt-2 flex items-center gap-2 text-xs font-medium text-warn">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            Prototype · No Live Bank Connection
          </p>

          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
            <span>{APP_META.dataMode}</span>
          </p>
        </div>

        <p className="flex items-center gap-1.5 px-1 text-[10px] uppercase tracking-[0.14em] text-dim">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          {APP_META.version}
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
