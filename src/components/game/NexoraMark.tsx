import { cn } from '@/lib/utils/cn'

/** Nexora's interlocking routes: a company mark, not a risk indicator. */
export function NexoraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('h-10 w-10 shrink-0 text-accent-ink', className)}
    >
      <rect x="1" y="1" width="38" height="38" rx="10" stroke="currentColor" strokeOpacity="0.25" />
      <path d="M10 28V12h5l10 16h5V12" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="m10 28 20-16" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.45" />
    </svg>
  )
}
