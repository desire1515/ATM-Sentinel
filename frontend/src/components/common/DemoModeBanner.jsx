import { LogOut, MonitorPlay } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'

export function DemoModeBanner() {
  const navigate = useNavigate()
  const { exitDemoMode, isDemoMode } = useAuth()

  if (!isDemoMode) return null

  const handleExit = () => {
    exitDemoMode()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      aria-label="Development demo mode"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-warn/40 bg-warn/10 px-4 py-2.5 text-xs sm:px-6"
    >
      <p className="flex items-center gap-2 font-semibold text-warn">
        <MonitorPlay className="h-4 w-4" aria-hidden="true" />
        DEMO MODE — SYNTHETIC MALAWI DATA
        <span className="font-normal text-muted">No Supabase session or live bank activity.</span>
      </p>
      <button
        type="button"
        onClick={handleExit}
        className="inline-flex items-center gap-1.5 rounded-md border border-warn/40 px-2.5 py-1.5 font-semibold text-warn transition-colors hover:bg-warn/10"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        Exit Demo Mode
      </button>
    </aside>
  )
}

export default DemoModeBanner
