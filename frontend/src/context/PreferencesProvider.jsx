import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PreferencesContext } from './preferences-context'
import {
  getMlDatasetStatus,
  refreshMlRecords,
  subscribeMlDatasetStatus,
} from '../services/mlDataAdapter'

const STORAGE_KEY = 'atm-sentinel:preferences'
const AUTO_REFRESH_MS = 30000

const DEFAULT_PREFERENCES = Object.freeze({
  darkMode: true,
  compactMode: false,
  autoRefresh: false,
  showAnomalyAlerts: true,
  reduceMotion: false,
})
const BOOLEAN_PREFERENCE_KEYS = Object.keys(DEFAULT_PREFERENCES)

function applyRootPreferences(preferences) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = preferences.darkMode ? 'dark' : 'light'
  document.documentElement.dataset.compact = String(preferences.compactMode)
  document.documentElement.style.colorScheme = preferences.darkMode ? 'dark' : 'light'
}

function readStoredPreferences() {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const stored = JSON.parse(raw)
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return DEFAULT_PREFERENCES
    }

    return BOOLEAN_PREFERENCE_KEYS.reduce((result, key) => {
      result[key] = typeof stored[key] === 'boolean' ? stored[key] : DEFAULT_PREFERENCES[key]
      return result
    }, {})
  } catch {
    // A corrupted/unavailable store must never break the dashboard.
    return DEFAULT_PREFERENCES
  }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences)
  const [refreshKey, setRefreshKey] = useState(0)
  const [datasetStatus, setDatasetStatus] = useState(getMlDatasetStatus)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshPromise = useRef(null)

  useEffect(() => {
    applyRootPreferences(preferences)
  }, [preferences])

  useEffect(() => subscribeMlDatasetStatus(setDatasetStatus), [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Storage is optional — ignore quota/private-mode failures.
    }
  }, [preferences])

  const refresh = useCallback(() => {
    if (refreshPromise.current) return refreshPromise.current

    setIsRefreshing(true)
    refreshPromise.current = refreshMlRecords()
      .then(() => {
        setRefreshKey((key) => key + 1)
        return { error: null }
      })
      .catch((error) => ({
        error: error instanceof Error ? error.message : 'Dataset refresh failed.',
      }))
      .finally(() => {
        setIsRefreshing(false)
        refreshPromise.current = null
      })

    return refreshPromise.current
  }, [])

  useEffect(() => {
    if (!preferences.autoRefresh) return undefined

    const timer = window.setInterval(() => {
      void refresh()
    }, AUTO_REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [preferences.autoRefresh, refresh])

  const updatePreference = useCallback((key, value) => {
    if (!BOOLEAN_PREFERENCE_KEYS.includes(key) || typeof value !== 'boolean') return
    setPreferences((current) => {
      const next = { ...current, [key]: value }
      applyRootPreferences(next)
      return next
    })
  }, [])

  const resetPreferences = useCallback(() => {
    applyRootPreferences(DEFAULT_PREFERENCES)
    setPreferences(DEFAULT_PREFERENCES)
  }, [])

  const lastUpdated = datasetStatus.lastSuccessfulAt

  const value = useMemo(
    () => ({
      ...preferences,
      refreshKey,
      datasetStatus,
      isRefreshing,
      lastUpdated,
      refresh,
      updatePreference,
      resetPreferences,
      autoRefreshIntervalMs: AUTO_REFRESH_MS,
    }),
    [
      preferences,
      refreshKey,
      datasetStatus,
      isRefreshing,
      lastUpdated,
      refresh,
      updatePreference,
      resetPreferences,
    ],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export default PreferencesProvider
