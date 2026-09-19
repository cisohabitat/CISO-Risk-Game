/**
 * Time controls (plan §9). Pause, three speeds and "advance to the next
 * meaningful event". The simulation pauses itself for anything material.
 */
import { Button } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import type { GameSpeed, PauseReason } from '@/game/types'
import { cn } from '@/lib/utils/cn'

const SPEEDS: { value: GameSpeed; label: string; title: string }[] = [
  { value: '1x', label: '1×', title: 'Normal speed' },
  { value: '2x', label: '2×', title: 'Double speed' },
  { value: '4x', label: '4×', title: 'Quadruple speed' },
]

const PAUSE_REASON_TEXT: Record<PauseReason, string> = {
  incident: 'An incident needs you',
  'board-decision': 'The board needs an answer',
  'decision-deadline': 'A decision is due',
  'assumption-invalidated': 'An assumption no longer holds',
  'quarter-end': 'Quarter end',
  'year-end': 'The year is over',
  player: 'Paused',
}

export function TimeControls({ compact = false }: { compact?: boolean }) {
  const state = useGameStore((store) => store.state)
  const dispatch = useGameStore((store) => store.dispatch)
  const advanceDays = useGameStore((store) => store.advanceDays)
  if (!state) return null

  const paused = state.paused || state.speed === 'paused'
  const blocked = state.decisions.openIds.some((id) => {
    const decision = state.decisions.decisions[id]
    return decision?.deadlineDay !== undefined && decision.deadlineDay - state.currentDay <= 1
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-1">
        <Button
          size="sm"
          variant={paused ? 'primary' : 'ghost'}
          className="compact min-h-9 px-3"
          aria-pressed={paused}
          onClick={() => dispatch({ type: 'setSpeed', speed: 'paused' })}
        >
          <span aria-hidden="true">❚❚</span>
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
      <Button
        size="sm"
        variant="secondary"
        className="compact min-h-9"
        disabled={state.finished}
        onClick={() => advanceDays(30)}
      >
        {compact ? 'Skip ahead' : 'Advance to next event'}
      </Button>
      {state.pauseReasons.length > 0 && (
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-medium',
            blocked ? 'border-band-high/40 bg-band-high-soft text-band-high' : 'border-line bg-surface-2 text-ink-muted',
          )}
          role="status"
        >
          {PAUSE_REASON_TEXT[state.pauseReasons[0]!]}
        </span>
      )}
    </div>
  )
}
