import { useId, useState } from 'react'
import { AlertCircle, LockKeyhole, LogIn, Play } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import BrandLogo from '../components/layout/BrandLogo'
import { Button } from '../components/common/Button'

function requestedPath(location) {
  const candidate = location.state?.from
  return typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')
    ? candidate
    : '/dashboard'
}

export function Login() {
  const emailId = useId()
  const passwordId = useId()
  const location = useLocation()
  const {
    configured,
    demoModeAvailable,
    enterDemoMode,
    error: authError,
    isDemoMode,
    loading,
    user,
    profileStatus,
    signIn,
    retryProfile,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const visibleError = error || (configured && !user ? authError : '')

  if (isDemoMode || (user && profileStatus === 'ready')) {
    return <Navigate to={requestedPath(location)} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  const handleEnterDemoMode = () => {
    setError('')
    enterDemoMode()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.13),transparent_55%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-hairline bg-panel/95 p-6 shadow-raised backdrop-blur sm:p-8">
        <BrandLogo className="mb-9" />

        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Secure access</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-body">Sign in to ATM SENTINEL</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Use your organization-provisioned account to access ATM monitoring.
          </p>
        </div>

        {!configured ? (
          <div role="alert" className="mb-5 flex gap-2 rounded-lg border border-warn/40 bg-warn/5 p-3 text-xs leading-5 text-muted">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            <span>
              Supabase is not configured. Add the project URL and publishable key to
              <code className="mx-1 rounded bg-panel-soft px-1 py-0.5 text-brand">frontend/.env.local</code>
              and restart Vite. Authentication is unavailable until then.
            </span>
          </div>
        ) : null}

        {user && profileStatus !== 'ready' ? (
          <div role="alert" className="mb-5 rounded-lg border border-risk/40 bg-risk/5 p-3 text-xs leading-5 text-muted">
            {authError ?? 'Your signed-in account is still being verified. Dashboard access remains blocked.'}
            {profileStatus === 'error' ? (
              <button
                type="button"
                onClick={retryProfile}
                className="ml-1 font-semibold text-brand underline underline-offset-2"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={emailId} className="mb-1.5 block text-xs font-semibold text-body">Email address</label>
            <input
              id={emailId}
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-lg border border-hairline bg-panel-soft px-3 text-sm text-body placeholder:text-dim focus:border-brand/60 focus:outline-none"
              placeholder="name@organization.com"
              disabled={!configured || loading || submitting || Boolean(user)}
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="mb-1.5 block text-xs font-semibold text-body">Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" aria-hidden="true" />
              <input
                id={passwordId}
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 w-full rounded-lg border border-hairline bg-panel-soft pl-9 pr-3 text-sm text-body placeholder:text-dim focus:border-brand/60 focus:outline-none"
                placeholder="Enter your password"
                disabled={!configured || loading || submitting || Boolean(user)}
              />
            </div>
          </div>

          {visibleError ? (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-risk/40 bg-risk/5 p-3 text-xs leading-5 text-risk">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {visibleError}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={LogIn}
            loading={submitting}
            disabled={!configured || loading || Boolean(user)}
            className="w-full"
          >
            Sign in
          </Button>
        </form>

        {demoModeAvailable ? (
          <div className="mt-5 border-t border-hairline pt-5">
            <p className="text-xs leading-5 text-muted">
              Development demo mode uses the bundled synthetic Malawi CSV only. It does not sign
              in to Supabase or access live bank activity.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              icon={Play}
              onClick={handleEnterDemoMode}
              disabled={loading || Boolean(user)}
              className="mt-3 w-full"
            >
              Enter Demo Mode
            </Button>
          </div>
        ) : null}

        <p className="mt-6 border-t border-hairline pt-5 text-center text-xs leading-5 text-dim">
          Accounts are created only through approved administrator onboarding. Public registration is disabled.
        </p>
      </section>
    </main>
  )
}

export default Login
