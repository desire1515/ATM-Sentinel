import { useMediaQuery } from '../../hooks/useMediaQuery'
import Sidebar from './Sidebar'
import Drawer from '../common/Drawer'

/**
 * Mobile/tablet navigation.
 * Below the `lg` breakpoint the sidebar becomes an off-canvas drawer so the
 * content column keeps the full viewport width.
 */
export function MobileNav({ open, onClose }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isCompactViewport = useMediaQuery('(min-width: 768px)')

  if (isDesktop || !open) return null

  return (
    <div className="lg:hidden">
      <Drawer
        open={open}
        onClose={onClose}
        size={isCompactViewport ? 'max-w-xs' : 'max-w-[300px]'}
        className="bg-ink-soft"
        bodyClassName="p-0"
      >
        <Sidebar onNavigate={onClose} widthClass="w-full" className="border-r-0" />
      </Drawer>
    </div>
  )
}

export default MobileNav
