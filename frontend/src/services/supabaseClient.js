import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ??
  ''
let authRateLimitUntil = 0

function rateLimitDelayMs(retryAfter) {
  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000

  const retryAt = Date.parse(retryAfter ?? '')
  return Number.isFinite(retryAt) && retryAt > Date.now()
    ? retryAt - Date.now()
    : 60000
}

function sanitizeAuthErrorValue(value, submittedSecrets) {
  if (typeof value !== 'string') return undefined

  const sanitized = value
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[redacted-token]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/[\r\n\t]+/g, ' ')

  return submittedSecrets.reduce(
    (result, secret) => result.split(secret).join('[redacted-request-value]'),
    sanitized,
  ).slice(0, 160)
}

async function logAuthResponseError(response, url, input, init) {
  const request = typeof Request !== 'undefined' && input instanceof Request ? input : init
  const method = (request?.method ?? 'GET').toUpperCase()
  const grantType = url.searchParams.get('grant_type')
  const safeGrantType = ['password', 'refresh_token'].includes(grantType) ? grantType : undefined
  const safeDetails = {
    status: response.status,
    method,
    endpoint: `${url.origin}${url.pathname}`,
    ...(safeGrantType ? { grantType: safeGrantType } : {}),
  }
  let responseState = 'empty_or_non_json'
  let errorDetails = {}
  let submittedSecrets = []

  try {
    let requestBody = request?.body
    if (typeof Request !== 'undefined' && input instanceof Request) {
      requestBody = await input.clone().json()
    } else if (typeof requestBody === 'string') {
      requestBody = JSON.parse(requestBody)
    }
    submittedSecrets = ['email', 'password', 'access_token', 'refresh_token']
      .map((field) => requestBody?.[field])
      .filter((value) => typeof value === 'string' && value.length > 0)
  } catch {
    // Request bodies are never logged; omit exact-value redaction if parsing is unavailable.
  }

  try {
    const body = await response.clone().json()
    responseState = 'json'

    for (const field of ['code', 'error', 'error_code', 'error_description', 'msg', 'message']) {
      const value = sanitizeAuthErrorValue(body?.[field], submittedSecrets)
      if (value) errorDetails[field] = value
    }
  } catch {
    // Keep the response body private when it is not valid JSON.
  }

  console.warn('[auth] Supabase authentication response failed.', {
    ...safeDetails,
    responseState,
    errorDetails,
  })
}

async function diagnosticFetch(input, init) {
  const response = await fetch(input, init)
  let url

  try {
    const requestUrl = typeof input === 'string' ? input : input.url ?? input.href
    url = new URL(requestUrl)
  } catch {
    return response
  }

  if (response.status >= 400 && url.pathname.startsWith('/auth/v1/')) {
    void logAuthResponseError(response, url, input, init)
  }

  if (response.status === 429 && url.pathname.startsWith('/auth/v1/')) {
    const delay = rateLimitDelayMs(response.headers.get('Retry-After'))
    authRateLimitUntil = Math.max(authRateLimitUntil, Date.now() + delay)
    const isRefreshRequest = url.pathname.endsWith('/token') &&
      url.searchParams.get('grant_type') === 'refresh_token'
    const operation = isRefreshRequest ? 'refresh-token request' : 'authentication request'

    console.warn(`[auth] Supabase ${operation} rate-limited (HTTP 429).`, {
      retryAfterSeconds: Math.ceil(delay / 1000),
    })
  }

  return response
}

export function getAuthRateLimitRemainingSeconds() {
  return Math.max(0, Math.ceil((authRateLimitUntil - Date.now()) / 1000))
}

function isServiceRoleKey(key) {
  if (/^sb_secret_/i.test(key)) return true

  const encodedPayload = key.split('.')[1]
  if (!encodedPayload || typeof atob !== 'function') return false

  try {
    const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(
      atob(base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=')),
    )
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

function validateConfiguration() {
  if (!supabaseUrl) return 'Set VITE_SUPABASE_URL in frontend/.env.local.'
  if (!publishableKey) {
    return 'Set VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local.'
  }

  try {
    const url = new URL(supabaseUrl)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol')
  } catch {
    return 'VITE_SUPABASE_URL must be a valid HTTP or HTTPS URL.'
  }

  if (isServiceRoleKey(publishableKey)) {
    return 'A service-role key cannot be used in frontend code. Use the publishable/anon key.'
  }

  return null
}

export const SUPABASE_CONFIG_ERROR = validateConfiguration()
export const SUPABASE_CONFIGURED = SUPABASE_CONFIG_ERROR === null

let cachedClient = null

// Vite can replace this module during development without unloading the page.
// Dispose the old client so its refresh timer and BroadcastChannel cannot
// survive alongside the replacement client. Session storage is untouched, so
// the new client restores the same real Supabase session normally.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    void cachedClient?.auth.dispose()
    cachedClient = null
  })
}

export function getSupabaseClient() {
  if (!SUPABASE_CONFIGURED) return null

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, publishableKey, {
      global: { fetch: diagnosticFetch },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return cachedClient
}

export const SUPABASE_STATUS = {
  configured: SUPABASE_CONFIGURED,
  connected: false,
  tables: [],
  message: SUPABASE_CONFIGURED
    ? 'Supabase credentials are configured. A live connection and database policies have not been verified.'
    : SUPABASE_CONFIG_ERROR,
}

export default { getSupabaseClient, SUPABASE_STATUS }
