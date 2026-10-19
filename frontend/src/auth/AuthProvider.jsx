import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from './auth-context'
import { ROLE_LABELS } from './roles'
import {
  getSupabaseClient,
  getAuthRateLimitRemainingSeconds,
  SUPABASE_CONFIG_ERROR,
  SUPABASE_CONFIGURED,
} from '../services/supabaseClient'
import {
  DEMO_ACCESS_PROFILE,
  DEMO_MODE_ENABLED,
  DEMO_MODE_STORAGE_KEY,
} from '../config/demoMode'

const PROFILE_FIELDS = 'id, full_name, role'
const PROFILE_QUERY_TIMEOUT_MS = 15000

function profileErrorMessage(error) {
  const retryAfter = getAuthRateLimitRemainingSeconds()
  if (error?.status === 429 || (error?.name === 'ProfileQueryTimeoutError' && retryAfter > 0)) {
    return `Supabase is rate-limiting requests. Wait about ${retryAfter || 60} seconds, then retry verification.`
  }
  if (error?.code === 'PGRST116') return 'Your account profile was not found.'
  if (error?.name === 'ProfileQueryTimeoutError') {
    return 'Profile verification timed out. Check your connection and retry.'
  }
  return 'Could not load your account profile. Check your connection or contact an administrator.'
}

function authErrorMessage(error) {
  if (error?.status === 429) {
    const retryAfter = getAuthRateLimitRemainingSeconds() || 60
    return `Supabase Authentication is rate-limiting requests. Wait about ${retryAfter} seconds before retrying.`
  }
  if (error?.code === 'invalid_credentials') {
    return 'Supabase rejected the sign-in (HTTP 400: invalid_credentials). Verify the email and password and confirm that the account is enabled.'
  }
  if (error?.code === 'email_not_confirmed') {
    return 'Supabase rejected the sign-in because the account email is not confirmed. Ask an administrator to verify the account setup.'
  }
  if (error?.code === 'user_not_found') {
    return 'Supabase could not find an account for this email. Verify the address or contact an administrator.'
  }
  if (error?.status === 400 || error?.status === 401) {
    const code = typeof error.code === 'string' && /^[a-z0-9_-]{1,64}$/i.test(error.code)
      ? `, code: ${error.code}`
      : ''
    return `Supabase rejected the sign-in (HTTP ${error.status}${code}). Verify the account credentials and authentication setup.`
  }
  if (error?.status >= 500) {
    return `Supabase Authentication returned an error (HTTP ${error.status}). Try again shortly.`
  }
  return 'Could not reach Supabase Authentication. Check your connection and try again.'
}

function getInitialDemoMode() {
  if (!DEMO_MODE_ENABLED || typeof window === 'undefined') return false

  try {
    return window.sessionStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'active'
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    loading: SUPABASE_CONFIGURED,
    session: null,
    user: null,
    profile: null,
    profileStatus: 'none',
    error: SUPABASE_CONFIGURED ? null : SUPABASE_CONFIG_ERROR,
  }))
  const profileRequest = useRef(0)
  const client = getSupabaseClient()
  const [isDemoMode, setIsDemoMode] = useState(getInitialDemoMode)

  const enterDemoMode = useCallback(() => {
    if (!DEMO_MODE_ENABLED) return false

    try {
      window.sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, 'active')
    } catch {
      // Storage is only used to make a development demo survive a refresh.
    }
    setIsDemoMode(true)
    return true
  }, [])

  const exitDemoMode = useCallback(() => {
    try {
      window.sessionStorage.removeItem(DEMO_MODE_STORAGE_KEY)
    } catch {
      // The in-memory state still exits demo mode if storage is unavailable.
    }
    setIsDemoMode(false)
  }, [])

  const loadProfile = useCallback(async (user, requestId, active = () => true) => {
    const controller = new AbortController()
    let timeoutId

    try {
      const query = client
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', user.id)
        .abortSignal(controller.signal)
        .maybeSingle()
      const timeout = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => {
          controller.abort()
          const error = new Error('Profile query timed out.')
          error.name = 'ProfileQueryTimeoutError'
          reject(error)
        }, PROFILE_QUERY_TIMEOUT_MS)
      })
      const { data, error } = await Promise.race([query, timeout])

      if (!active() || profileRequest.current !== requestId) return

      if (error) {
        setAuth((current) => ({
          ...current,
          profile: null,
          profileStatus: 'error',
          error: profileErrorMessage(error),
        }))
        return
      }

      if (!data) {
        setAuth((current) => ({
          ...current,
          profile: null,
          profileStatus: 'missing',
          error: 'Your account is not provisioned. Contact an administrator for access.',
        }))
        return
      }

      if (!ROLE_LABELS[data.role]) {
        setAuth((current) => ({
          ...current,
          profile: null,
          profileStatus: 'error',
          error: 'Your account has an unrecognized role. Contact an administrator.',
        }))
        return
      }

      setAuth((current) => ({
        ...current,
        profile: data,
        profileStatus: 'ready',
        error: null,
      }))
    } catch (error) {
      if (!active() || profileRequest.current !== requestId) return
      setAuth((current) => ({
        ...current,
        profile: null,
        profileStatus: 'error',
        error: profileErrorMessage(error),
      }))
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [client])

  useEffect(() => {
    if (!client) return undefined

    let active = true
    let profileTimer

    const applySession = (session) => {
      window.clearTimeout(profileTimer)
      const requestId = ++profileRequest.current
      const user = session?.user ?? null
      setAuth({
        loading: false,
        session,
        user,
        profile: null,
        profileStatus: user ? 'loading' : 'none',
        error: null,
      })

      if (user) {
        profileTimer = window.setTimeout(() => {
          void loadProfile(user, requestId, () => active)
        }, 0)
      }
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      applySession(session)
    })

    return () => {
      active = false
      window.clearTimeout(profileTimer)
      subscription.unsubscribe()
    }
  }, [client, loadProfile])

  const signIn = useCallback(async (email, password) => {
    if (!client) return { error: SUPABASE_CONFIG_ERROR }

    const retryAfter = getAuthRateLimitRemainingSeconds()
    if (retryAfter > 0) {
      return {
        error: `Supabase Authentication is rate-limiting requests. Wait about ${retryAfter} seconds before retrying.`,
      }
    }

    try {
      const { error } = await client.auth.signInWithPassword({ email, password })
      return { error: error ? authErrorMessage(error) : null }
    } catch (error) {
      return { error: authErrorMessage(error) }
    }
  }, [client])

  const signOut = useCallback(async () => {
    if (!client) return { error: SUPABASE_CONFIG_ERROR }

    try {
      const { error } = await client.auth.signOut()
      return { error: error ? authErrorMessage(error) : null }
    } catch {
      return { error: 'Could not sign out because the authentication service is unavailable.' }
    }
  }, [client])

  const retryProfile = useCallback(() => {
    if (!client || !auth.user) return
    const requestId = ++profileRequest.current
    setAuth((current) => ({ ...current, profileStatus: 'loading', error: null }))
    void loadProfile(auth.user, requestId)
  }, [auth.user, client, loadProfile])

  const value = useMemo(
    () => ({
      ...auth,
      configured: SUPABASE_CONFIGURED,
      isDemoMode,
      demoModeAvailable: DEMO_MODE_ENABLED,
      // Kept separate from `auth.profile`: this is never read from or written
      // to Supabase and is only consumed by the local route/UI access checks.
      accessProfile: isDemoMode ? DEMO_ACCESS_PROFILE : auth.profile,
      enterDemoMode,
      exitDemoMode,
      signIn,
      signOut,
      retryProfile,
    }),
    [auth, enterDemoMode, exitDemoMode, isDemoMode, signIn, signOut, retryProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
