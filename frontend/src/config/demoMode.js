// Demo access is deliberately compiled out of production behavior. Vite sets
// DEV to false for `vite build`, even if a production environment supplies the
// VITE_ENABLE_DEMO_MODE variable.
export const DEMO_MODE_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_MODE === 'true'

// This is an access policy for the local CSV demonstration, not a Supabase
// user or session. It gives the demo the existing read-only dashboard routes.
export const DEMO_ACCESS_PROFILE = Object.freeze({
  full_name: 'Local demonstration',
  role: 'system_administrator',
})

export const DEMO_MODE_STORAGE_KEY = 'atm-sentinel:development-demo-mode'
