/**
 * People drawn as people. The executives and the cyber leaders were identical
 * text cards with a grey "neutral" chip, so a relationship that had moved all
 * year looked the same in December as in January.
 */
import { cn } from '@/lib/utils/cn'
import portraitAtlas from '@/assets/art/nexora-people.webp'

/** Row-major positions in the three-column, four-row portrait atlas. */
const PORTRAITS: Readonly<Record<string, number>> = {
  'stk-ceo': 0,
  'stk-cio': 1,
  'stk-coo': 2,
  'stk-cfo': 3,
  'stk-digital': 4,
  'stk-board': 5,
  'stk-procurement': 6,
  'stk-legal': 7,
  'lead-soc': 8,
  'lead-arch': 9,
  'lead-grc': 10,
  'lead-eng': 11,
}

const SCALE = ['resistant', 'cautious', 'neutral', 'supportive', 'trusted'] as const

export function initials(name: string): string {
  const parts = name.split(/\s+/).filter((part) => /^[A-Za-z]/.test(part))
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase()
}

/** Decorative beside the person's visible name; initials survive a missing image or a custom campaign. */
export function PersonPortrait({ id, name, className }: { id: string; name: string; className?: string }) {
  const position = PORTRAITS[id]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 font-display text-sm text-ink-muted',
        className,
      )}
    >
      {initials(name)}
      {position !== undefined && (
        <img
          src={portraitAtlas}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          style={{ width: '300%', height: '400%', left: `${-(position % 3) * 100}%`, top: `${-Math.floor(position / 3) * 100}%` }}
          onError={(event) => { event.currentTarget.hidden = true }}
        />
      )}
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
