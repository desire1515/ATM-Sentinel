import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LogOut, RefreshCw, ShieldAlert } from 'lucide-react'
import { useAuth } from './auth-context'
import { canAccessPath } from './roles'
import BrandLogo from '../components/layout/BrandLogo'
import { Button } from '../components/common/Button'
import { LoadingState } from '../components/common/LoadingState'

function ProfileUnavailable() {
  const { error, profileStatus, retryProfile, signOut } = useAuth()
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const result = await signOut()
    setSigningOut(false)
    setSignOutError(result.error ?? '')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-hairline bg-panel/90 p-6 shadow-raised sm:p-8">
        <BrandLogo className="mb-8" />
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-risk/40 bg-risk/10 text-risk">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-body">Account access unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {error ?? 'Your account could not be verified. Access remains blocked until it can be confirmed.'}
        </p>
        {profileStatus === 'missing' ? (
          <p className="mt-3 text-xs leading-5 text-dim">
            Accounts must be provisioned through the approved administrator onboarding process.
          </p>
        ) : null}
        {signOutError ? <p role="alert" className="mt-3 text-xs text-risk">{signOutError}</p> : null}
        <div className="mt-6 flex flex-wrap gap-2">
          {profileStatus === 'error' ? (
            <Button icon={RefreshCw} onClick={retryProfile}>Retry verification</Button>
          ) : null}
          <Button variant="ghost" icon={LogOut} loading={signingOut} onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  )
}

export function RequireAuth({ children }) {
  const location = useLocation()
  const { configured, isDemoMode, loading, user, profileStatus } = useAuth()

  if (isDemoMode) return children

  if (!configured || !user) {
    if (loading && configured) return <LoadingState label="Restoring secure session…" className="min-h-screen" />
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (profileStatus === 'loading') {
    return <LoadingState label="Verifying account permissions…" className="min-h-screen" />
  }

  if (profileStatus !== 'ready') return <ProfileUnavailable />
  return children
}

export function RequireRole({ children }) {
  const location = useLocation()
  const { accessProfile } = useAuth()

  if (!canAccessPath(accessProfile?.role, location.pathname)) {
    return <Navigate to="/access-denied" state={{ from: location.pathname }} replace />
  }

  return children
}
