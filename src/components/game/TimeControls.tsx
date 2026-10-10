/**
 * Time controls (plan §9). Pause, three speeds and "advance to the next
 * meaningful event". The simulation pauses itself for anything material.
 */
import { Button } from '@/components/ui/primitives'
import { livePauseReasons } from '@/store/selectors'
import { useGameStore } from '@/store/game-store'
import type { GameSpeed, PauseReason } from '@/game/types'
import { cn } from '@/lib/utils/cn'
import { Icon } from '@/components/ui/icons'

const SPEEDS: { value: GameSpeed; label: string; title: string }[] = [
  { value: '1x', label: '1×', title: 'Normal speed' },
  { value: '2x', label: '2×', title: 'Double speed' },
  { value: '4x', label: '4×', title: 'Quadruple speed' },
]

/**
 * The pill was grey whatever it said, so "An incident needs you" looked like a
 * disabled control: the most urgent thing in the header read the weakest. It
 * takes the colour of what stopped the clock.
 */
const PAUSE_REASON_TONE: Record<PauseReason, string> = {
  incident: 'border-band-severe/50 bg-band-severe-soft text-band-severe',
  'board-decision': 'border-band-elevated/50 bg-band-elevated-soft text-band-elevated',
  'decision-deadline': 'border-band-elevated/50 bg-band-elevated-soft text-band-elevated',
  'assumption-invalidated': 'border-band-elevated/50 bg-band-elevated-soft text-band-elevated',
  'programme-blocked': 'border-band-elevated/50 bg-band-elevated-soft text-band-elevated',
  'quarter-end': 'border-accent/40 bg-accent-soft text-accent-ink',
  'year-end': 'border-accent/40 bg-accent-soft text-accent-ink',
  player: 'border-line bg-surface-2 text-ink-muted',
}

const PAUSE_REASON_TEXT: Record<PauseReason, string> = {
  incident: 'An incident needs you',
  'board-decision': 'The board needs an answer',
  'decision-deadline': 'A decision is due',
  'assumption-invalidated': 'An assumption no longer holds',
  'programme-blocked': 'A programme is blocked',
  'quarter-end': 'Quarter end',
  'year-end': 'The year is over',
  player: 'Paused',
}

export function TimeControls({ compact = false }: { compact?: boolean }) {
  const state = useGameStore((store) => store.state)
  const dispatch = useGameStore((store) => store.dispatch)
  const advanceDays = useGameStore((store) => store.advanceDays)
  if (!state) return null
  const reasons = livePauseReasons(state)

  // The year over, the clock has nothing left to do. Its controls stayed: the
  // speeds greyed, Skip ahead greyed, and pause still lit as if it were live.
  // The banner above every screen carries the way to the review.
  if (state.finished) {
    return (
      <p role="status" className="text-sm text-ink-muted" data-testid="year-over">
        The year is over.
      </p>
    )
  }

  const paused = state.paused || state.speed === 'paused'
  const blocked = state.decisions.openIds.some((id) => {
    const decision = state.decisions.decisions[id]
    return decision?.deadlineDay !== undefined && decision.deadlineDay - state.currentDay <= 1
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-1">
        {/* Phones get a single play/pause toggle; the speeds appear from the
            tablet breakpoint up, where there is room for them. */}
        <div className="sm:hidden">
          <Button
            size="sm"
            variant={paused ? 'secondary' : 'primary'}
            className="compact min-h-9 px-3"
            disabled={state.finished}
            onClick={() => dispatch({ type: 'setSpeed', speed: paused ? '1x' : 'paused' })}
          >
            <Icon name={paused ? 'play' : 'pause'} size={16} />
            <span className="sr-only">{paused ? 'Resume time' : 'Pause time'}</span>
          </Button>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <Button
            size="sm"
            variant={paused ? 'primary' : 'ghost'}
            className="compact min-h-9 px-3"
            aria-pressed={paused}
            onClick={() => dispatch({ type: 'setSpeed', speed: 'paused' })}
          >
            <Icon name="pause" size={16} />
            <span className="sr-only">Pause</span>
          </Button>
          {SPEEDS.map((speed) => (
            <Button
              key={speed.value}
              size="sm"
              variant={!paused && state.speed === speed.value ? 'primary' : 'ghost'}
              className="compact min-h-9 px-3 tabular-nums"
              aria-pressed={!paused && state.speed === speed.value}
              title={speed.title}
              disabled={state.finished}
              onClick={() => dispatch({ type: 'setSpeed', speed: speed.value })}
            >
              {speed.label}
            </Button>
          ))}
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="compact min-h-9"
        disabled={state.finished}
        onClick={() => advanceDays(30)}
      >
        {compact ? 'Skip ahead' : 'Advance to next event'}
      </Button>
      {/* Always present, for the same reason as the toasts: a status that
          arrives with its region is not reliably announced. */}
      <span role="status" data-testid="pause-reason" className="contents">
        {reasons.length > 0 && (
          // Visually hidden below the desktop layout, where it took a row of
          // the header and repeated what the Briefing leads with; still
          // announced. On a 768px tablet it squeezed the date and budget to
          // "8 Febru…" and "£1.7m le…" whenever it showed (AI tablet playtest).
          <span
            data-reason={reasons[0]}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-medium max-lg:sr-only',
              blocked && reasons[0] !== 'incident'
                ? 'border-band-high/40 bg-band-high-soft text-band-high'
                : PAUSE_REASON_TONE[reasons[0]!],
            )}
          >
            {PAUSE_REASON_TEXT[reasons[0]!]}
          </span>
        )}
      </span>
    </div>
  )
}
