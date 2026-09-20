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

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      role="status"
      aria-live="polite"
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
            toast.tone === 'warning'
              ? 'border-band-elevated/50 bg-band-elevated-soft text-ink'
              : toast.tone === 'success'
                ? 'border-positive/40 bg-band-low-soft text-ink'
                : 'border-line bg-surface text-ink',
          )}
        >
          <span className="text-pretty">{toast.message}</span>
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
