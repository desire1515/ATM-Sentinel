import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CircleCheck, TriangleAlert, ShieldAlert } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatRelativeTime } from '../../utils/format'
import { useDismiss } from '../../hooks/useDismiss'
import { useServiceQuery } from '../../hooks/useServiceQuery'
import { dashboardService } from '../../services'

const TONE_ICONS = { risk: ShieldAlert, warn: TriangleAlert, ok: CircleCheck }

const TONE_CLASSES = {
  risk: 'border-risk/30 bg-risk/10 text-risk',
  warn: 'border-warn/30 bg-warn/10 text-warn',
  ok: 'border-ok/30 bg-ok/10 text-ok',
}

/**
 * Displays recent flagged observations. This does not represent a delivered
 * notification service.
 */
export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { data } = useServiceQuery(() => dashboardService.fetchDashboardOverview())

  useDismiss(ref, () => setOpen(false), { active: open })

  const notifications = data?.notifications ?? []
  const alertCount = notifications.length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-panel-soft text-muted transition-colors hover:border-brand/40 hover:text-brand"
      >
        <span className="sr-only">
          Recent flagged observations {alertCount ? `(${alertCount})` : ''}
        </span>
        <Bell className="h-4 w-4" aria-hidden="true" />

        {alertCount ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-risk px-1 text-[10px] font-bold text-white"
          >
            {alertCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-[min(92vw,340px)] overflow-hidden rounded-xl border border-hairline bg-ink/98 shadow-raised backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2.5">
            <p className="text-xs font-semibold text-body">Anomaly alerts</p>
            <span className="rounded-full border border-hairline bg-panel-soft px-2 py-0.5 text-[10px] uppercase tracking-wide text-dim">
              Dataset results
            </span>
          </div>

          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">No flagged observations available.</p>
          ) : (
            <ul className="scroll-area max-h-[320px] divide-y divide-hairline/60 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = TONE_ICONS[notification.tone] ?? TriangleAlert

                return (
                  <li key={notification.id}>
                    <Link
                      to={notification.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-3 py-3 transition-colors hover:bg-panel-soft"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                          TONE_CLASSES[notification.tone] ?? TONE_CLASSES.warn,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-body">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted">
                          {notification.body}
                        </span>
                        <span className="mt-1 block text-[10px] text-dim">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          <p className="border-t border-hairline px-3 py-2 text-[10px] leading-4 text-dim">
            These entries are derived from the latest flagged observations in the dataset; notification delivery is not implemented.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationMenu
