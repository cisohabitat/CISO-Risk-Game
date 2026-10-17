import { useEffect, useRef } from 'react'

/** One quiet pulse for an observed change; mounting/loading is not a change. */
export function useChangeHighlight<T extends HTMLElement>(value: string | number) {
  const element = useRef<T>(null)
  const previous = useRef(value)
  useEffect(() => {
    const changed = previous.current !== value
    previous.current = value
    const target = element.current
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!changed || !target || motion?.matches || !target.animate) return
    const colour = getComputedStyle(target).getPropertyValue('--accent-soft').trim()
    if (!colour) return
    const animation = target.animate([
      { backgroundColor: 'transparent' },
      { backgroundColor: colour, offset: 0.25 },
      { backgroundColor: 'transparent' },
    ], { duration: 1000, easing: 'ease-out' })
    const stop = () => { if (motion?.matches) animation.cancel() }
    motion?.addEventListener?.('change', stop)
    return () => { animation.cancel(); motion?.removeEventListener?.('change', stop) }
  }, [value])
  return element
}
