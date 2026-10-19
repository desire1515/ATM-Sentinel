import { createContext, useContext } from 'react'

/**
 * Dashboard preferences + a global refresh signal.
 *
 * These values are shared because they genuinely affect more than one screen
 * (compact density, auto-refresh cadence, alert visibility). Everything else in
 * the app keeps its state local to the page that owns it.
 */
export const PreferencesContext = createContext(null)

export function usePreferences() {
  const value = useContext(PreferencesContext)

  if (!value) {
    throw new Error('usePreferences must be used inside <PreferencesProvider>')
  }

  return value
}

export default PreferencesContext
