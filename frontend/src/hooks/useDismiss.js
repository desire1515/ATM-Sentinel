import { useEffect } from 'react'

/**
 * Dismiss helper for menus, popovers and drawers.
 * Closes on outside pointer-down, on Escape (keyboard accessibility) and
 * optionally locks body scroll while an overlay is open.
 */
export function useDismiss(ref, onDismiss, { active = true, lockScroll = false } = {}) {
  useEffect(() => {
    if (!active) return undefined

    const handlePointerDown = (event) => {
      const node = ref.current
      if (!node) return
      if (node.contains(event.target)) return
      onDismiss()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    if (lockScroll) document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      if (lockScroll) document.body.style.overflow = previousOverflow
    }
  }, [ref, onDismiss, active, lockScroll])
}

export default useDismiss
