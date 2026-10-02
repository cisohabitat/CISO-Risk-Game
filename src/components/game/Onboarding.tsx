/**
 * Renders whichever lesson the player has reached and not yet dismissed.
 * The lessons themselves live in ./lessons so their triggers can be tested
 * against real campaigns without a browser.
 */
import { Button } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { LESSONS, lessonContext } from './lessons'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { cn } from '@/lib/utils/cn'

export function Onboarding({ className }: { className?: string }) {
  const state = useGameStore((store) => store.state)
  const dispatch = useGameStore((store) => store.dispatch)
  // A lesson teaches a mechanic the player is about to use. On 31 December
  // there is nothing left to use it on, and "record what you are relying on,
  // because it will be checked" sat on top of the annual review in the
  // photographed playthrough. The year over, the notes step aside.
  if (!state || state.finished) return null

  const context = lessonContext(state)
  const coached = DIFFICULTY_PROFILES[state.difficulty].showsDecisionCoaching
  // While an incident runs, the only note worth the space is the one about
  // incidents. The others wait: in the first quarter "start by looking" sat
  // between the incident bar and the briefing, ahead of the note on what an
  // incident asks of you, because it came first in the list.
  const lesson = LESSONS.find(
    (candidate) =>
      !state.tutorial.dismissed.includes(candidate.id) &&
      (coached || !candidate.coachedOnly) &&
      (context.liveIncidents === 0 || candidate.teaches === 'incident') &&
      candidate.when(context),
  )
  if (!lesson) return null

  // One quiet line above the screen, not a card. As a card it took a sixth of
  // the screen above the briefing's own headline, beneath an incident banner,
  // and pushed what the day was about below the fold.
  return (
    <aside
      aria-label="How this works"
      className={cn('mb-4 flex items-start gap-3 border-l-2 border-accent bg-accent-soft/30 py-2 pl-3 pr-2', className)}
    >
      <p className="min-w-0 flex-1 text-sm text-pretty">
        <span className="font-medium text-ink">{lesson.title}</span>
        <span className="text-ink-muted">. {lesson.body}</span>
      </p>
      <Button
        variant="quiet"
        size="sm"
        className="compact min-h-9 shrink-0"
        onClick={() => dispatch({ type: 'dismissTutorial', id: lesson.id })}
      >
        Got it
      </Button>
    </aside>
  )
}
