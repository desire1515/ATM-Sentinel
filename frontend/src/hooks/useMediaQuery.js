import { useEffect, useState } from 'react'

/**
 * Reactive media query hook.
 * Used for responsive behaviour that CSS alone cannot express (e.g. switching
 * tables to card lists, or deciding whether the sidebar is a drawer).
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined

    const mediaQuery = window.matchMedia(query)
    const handleChange = (event) => setMatches(event.matches)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

export default useMediaQuery
