/**
 * People drawn as people. The executives and the cyber leaders were identical
 * text cards with a grey "neutral" chip, so a relationship that had moved all
 * year looked the same in December as in January.
 */
import { cn } from '@/lib/utils/cn'

const SCALE = ['resistant', 'cautious', 'neutral', 'supportive', 'trusted'] as const

export function initials(name: string): string {
  const parts = name.split(/\s+/).filter((part) => /^[A-Za-z]/.test(part))
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase()
}

export function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-2 font-display text-sm text-ink-muted',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/** Where a relationship sits, from resistant to trusted, as a word and a position. */
export function RelationshipScale({ band }: { band: string }) {
  const at = SCALE.indexOf(band.toLowerCase() as (typeof SCALE)[number])
  const word = band.charAt(0).toUpperCase() + band.slice(1).toLowerCase()
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${word}, on a scale from resistant to trusted`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {SCALE.map((step, position) => (
          <span
            key={step}
            className={cn(
              'h-2 w-3 rounded-sm',
              position === at
                ? position < 2
                  ? 'bg-band-high'
                  : position === 2
                    ? 'bg-ink-faint'
                    : 'bg-positive'
                : 'bg-line',
            )}
          />
        ))}
      </span>
      <span aria-hidden="true" className="text-xs text-ink-muted">{word}</span>
    </div>
  )
}
