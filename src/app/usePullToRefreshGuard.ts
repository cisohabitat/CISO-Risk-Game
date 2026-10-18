import { useEffect } from 'react'

/** Keep a downward edge swipe in the game without taking over normal scrolling. */
export function usePullToRefreshGuard(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    root.dataset.gameplayScroll = 'true'
    let previous: { x: number; y: number } | undefined
    let target: Element | null = null
    const start = (event: TouchEvent) => {
      previous = event.touches.length === 1 ? { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY } : undefined
      target = event.target instanceof Element ? event.target : null
      // Preserve native editing/selection and the map's own pan/zoom gestures.
      if (target?.closest('input, textarea, select, [contenteditable="true"], .react-flow')) previous = undefined
    }
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 1) { previous = undefined; return }
      if (!previous) return
      const touch = event.touches[0]!
      const dx = touch.clientX - previous.x
      const dy = touch.clientY - previous.y
      if (Math.abs(dx) + Math.abs(dy) < 4) return
      previous = { x: touch.clientX, y: touch.clientY }
      if (dy <= 0 || dy <= Math.abs(dx) || !event.cancelable) return
      // A reader or dialog that can scroll towards its top owns this gesture.
      for (let element = target; element && element !== document.body && element !== root; element = element.parentElement) {
        if (/^(auto|scroll)$/.test(getComputedStyle(element).overflowY) && element.scrollTop > 0 && element.scrollHeight > element.clientHeight) return
      }
      if ((document.scrollingElement?.scrollTop ?? window.scrollY) > 0) return
      event.preventDefault()
    }
    const end = () => { previous = undefined; target = null }
    document.addEventListener('touchstart', start, { passive: true })
    // iOS versions that do not honour root overscroll CSS need a cancellable
    // move at the top edge. Never cancel taps, upward swipes or multi-touch.
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end, { passive: true })
    document.addEventListener('touchcancel', end, { passive: true })
    return () => {
      delete root.dataset.gameplayScroll
      document.removeEventListener('touchstart', start)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', end)
      document.removeEventListener('touchcancel', end)
    }
  }, [active])
}
