import { useEffect, useState } from 'react'
import { AlertTriangle, Clock3, Loader2, Menu, ShieldCheck } from 'lucide-react'
import { formatTime } from '../../utils/format'
import { usePreferences } from '../../context/preferences-context'
import GlobalSearch from './GlobalSearch'
import NotificationMenu from './NotificationMenu'

/**
 * Top application header for the local demonstration.
 */
export function Header({ title, subtitle, onOpenNav, isRefreshing: queryRefreshing = false }) {
  const { showAnomalyAlerts, datasetStatus, isRefreshing } = usePreferences()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-ink/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-panel-soft text-muted transition-colors hover:text-body lg:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-body sm:text-lg">
            {title}
          </h1>
          <p className="hidden truncate text-xs text-muted sm:block">{subtitle}</p>
        </div>

        <GlobalSearch className="hidden w-[280px] shrink-0 md:block xl:w-[340px]" />

        <div className="hidden items-center gap-2 rounded-lg border border-hairline bg-panel-soft/60 px-2.5 py-1.5 xl:flex">
          {datasetStatus.state === 'success'
            ? <ShieldCheck className="h-3.5 w-3.5 text-ok" aria-hidden="true" />
            : <AlertTriangle className="h-3.5 w-3.5 text-warn" aria-hidden="true" />}
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {datasetStatus.state === 'success'
              ? 'Dataset Available'
              : datasetStatus.state === 'error'
                ? 'Dataset Unavailable'
                : datasetStatus.state === 'loading'
                  ? 'Checking Dataset'
                  : 'Status Not Verified'}
          </span>
          <Clock3 className="h-3.5 w-3.5 text-dim" aria-hidden="true" />
          <span className="tabular text-[11px] text-dim" title="Current local time">
            {formatTime(now, { withSeconds: true })} local
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRefreshing || queryRefreshing ? (
            <span
              role="status"
              className="hidden items-center gap-1.5 text-[11px] text-muted sm:flex"
            >
              <Loader2 className="h-3 w-3 animate-spin text-brand" aria-hidden="true" />
              Updating
            </span>
          ) : null}

          {showAnomalyAlerts ? (
            <NotificationMenu />
          ) : null}
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <GlobalSearch compact className="w-full" />
      </div>
    </header>
  )
}

export default Header
