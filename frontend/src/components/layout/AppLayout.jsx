import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { usePreferences } from '../../context/preferences-context'
import { APP_META } from '../../utils/constants'
import { resolvePageMeta } from '../../utils/navigation'
import { cn } from '../../utils/cn'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'
import SourceContextBanner from '../common/SourceContextBanner'

/**
 * Application shell: persistent sidebar (desktop), drawer navigation (mobile),
 * sticky header, scrollable content area and footer.
 */
export function AppLayout() {
  const location = useLocation()
  const { compactMode } = usePreferences()

  // The drawer records the route it was opened on, so any navigation (including
  // browser back/forward) closes it through derivation instead of an effect.
  const [navState, setNavState] = useState({ open: false, path: location.pathname })
  const navOpen = navState.open && navState.path === location.pathname
  const openNav = () => setNavState({ open: true, path: location.pathname })
  const closeNav = () => setNavState((state) => ({ ...state, open: false }))

  const meta = resolvePageMeta(location.pathname)

  return (
    <div className="flex min-h-screen bg-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-brand/50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-brand"
      >
        Skip to main content
      </a>

      <Sidebar className="sticky top-0 hidden h-screen lg:flex" />
      <MobileNav open={navOpen} onClose={closeNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenNav={openNav}
        />
        <SourceContextBanner />

        <main
          id="main-content"
          className={cn('flex-1', compactMode && 'text-[15px] leading-relaxed')}
        >
          <Outlet />
        </main>

        <footer className="border-t border-hairline px-4 py-4 text-[11px] text-dim sm:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {APP_META.name} · Malawi synthetic-data prototype
            </p>
            <p>
              {APP_META.dataMode} · No Live Bank Connection · {APP_META.student} · {APP_META.version}
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
