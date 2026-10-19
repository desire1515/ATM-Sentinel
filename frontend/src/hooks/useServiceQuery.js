import { useCallback, useEffect, useRef, useState } from 'react'
import { usePreferences } from '../context/preferences-context'

/**
 * Loads data from a service function and exposes the four UI states every page
 * needs: loading, refreshing, error and loaded.
 *
 * The hook subscribes to the global refresh signal so "Refresh data" in Settings
 * (and optional auto-refresh) re-runs every mounted query. `deps` lets a caller
 * re-run the query when a parameter changes (for example an :id route segment).
 */
export function useServiceQuery(queryFn, options = {}) {
  const { deps = [], enabled = true, initialData = null } = options
  const { refreshKey } = usePreferences()

  // The query function is kept in a ref so a new inline function identity on each
  // render does not re-trigger the request.
  const queryRef = useRef(queryFn)
  const [retryKey, setRetryKey] = useState(0)

  const [state, setState] = useState({
    data: initialData,
    loading: enabled && initialData == null,
    refreshing: false,
    error: null,
  })

  useEffect(() => {
    queryRef.current = queryFn
  }, [queryFn])

  // Primitive key so the effect dependency list stays statically checkable.
  const depsKey = JSON.stringify(deps)

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false

    const run = async () => {
      // Deferred one microtask so the request lifecycle never sets state
      // synchronously inside the effect body.
      await Promise.resolve()
      if (cancelled) return

      setState((current) => ({
        data: current.data,
        loading: current.data == null,
        refreshing: current.data != null,
        error: null,
      }))

      try {
        const data = await queryRef.current()
        if (!cancelled) setState({ data, loading: false, refreshing: false, error: null })
      } catch (error) {
        if (!cancelled) setState({ data: null, loading: false, refreshing: false, error })
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [enabled, refreshKey, retryKey, depsKey])

  const refetch = useCallback(() => setRetryKey((key) => key + 1), [])

  return { ...state, refetch }
}

export default useServiceQuery
