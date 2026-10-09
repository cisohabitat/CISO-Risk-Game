import { useEffect } from 'react'
import { useGameStore } from '@/store/game-store'
import { cn } from '@/lib/utils/cn'

/** Transient feedback. Never the only place something important is said. */
export function Toasts() {
  const toasts = useGameStore((store) => store.ui.toasts)
  const dismissToast = useGameStore((store) => store.dismissToast)

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) => window.setTimeout(() => dismissToast(toast.id), 5200))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [toasts, dismissToast])

  // The live region is always in the page, empty when there is nothing to
  // say. Rendered only alongside its first toast, it arrived with its content,
  // and screen readers do not reliably announce a region's initial content:
  // "Campaign saved" could pass in silence.
  return (
    <div
      // A corner, not the middle of the page: centred, they sat over the
      // cards a player had just come back to read. Above the tab bar on a
      // phone, in the bottom-right on a desktop.
      className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end lg:px-0"
      role="status"
      aria-live="polite"
      data-testid="toasts"
      data-print="hide"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            // The body stays transparent to the pointer: three of these stack
            // above the fold and sat over the Decide button, where a click
            // meant for the page hit the toast and did nothing. Only the
            // dismiss control needs to be clickable.
            'flex max-w-lg items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-[var(--shadow-lift)] animate-rise',
            // One at a time on a phone, where two covered a quarter of the screen.
            'max-lg:[&:not(:last-child)]:hidden',
            // And slimmer there: a three-line notification over the list was
            // a card of its own. Two lines at most; the rest is in the inbox
            // or the year view, as everything a notification says must be.
            'max-lg:px-3 max-lg:py-2 max-lg:text-xs',
            toast.tone === 'warning'
              ? 'border-band-elevated/50 bg-band-elevated-soft text-ink'
              : toast.tone === 'success'
                ? 'border-positive/40 bg-band-low-soft text-ink'
                : 'border-line bg-surface text-ink',
          )}
        >
          <span className="text-pretty max-lg:line-clamp-2">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
            className="pointer-events-auto compact -mr-1 -mt-1 shrink-0 rounded px-2 py-1 text-ink-faint hover:text-ink"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
