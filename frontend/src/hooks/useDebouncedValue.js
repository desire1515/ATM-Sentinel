import { useEffect, useState } from 'react'

/** Delays a rapidly changing value (search inputs) to avoid work per keystroke. */
export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebouncedValue
