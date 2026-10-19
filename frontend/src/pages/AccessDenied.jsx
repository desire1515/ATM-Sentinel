import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../components/common/Button'
import { useAuth } from '../auth/auth-context'
import { ROLE_LABELS } from '../auth/roles'
import BrandLogo from '../components/layout/BrandLogo'

export function AccessDenied() {
  const location = useLocation()
  const { accessProfile } = useAuth()

  if (!accessProfile) return <Navigate to="/login" replace />

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-hairline bg-panel/90 p-6 shadow-raised sm:p-8">
        <BrandLogo className="mb-8" />
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-warn/40 bg-warn/5 text-warn">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-body">Access not permitted</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your {ROLE_LABELS[accessProfile.role] ?? 'assigned'} role cannot open this page.
          Contact an administrator if you believe your access should be changed.
        </p>
        {location.state?.from ? (
          <p className="mt-2 break-all text-xs text-dim">Requested page: {location.state.from}</p>
        ) : null}
        <Button to="/dashboard" variant="primary" className="mt-6">Return to dashboard</Button>
      </section>
    </main>
  )
}

export default AccessDenied
