/**
 * Renders whichever lesson the player has reached and not yet dismissed.
 * The lessons themselves live in ./lessons so their triggers can be tested
 * against real campaigns without a browser.
 */
import { Button } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { LESSONS, lessonContext } from './lessons'

export function Onboarding() {
  const state = useGameStore((store) => store.state)
  const dispatch = useGameStore((store) => store.dispatch)
  if (!state) return null

  const context = lessonContext(state)
  const lesson = LESSONS.find(
    (candidate) => !state.tutorial.dismissed.includes(candidate.id) && candidate.when(context),
  )
  if (!lesson) return null

  return (
    <aside className="mb-4 rounded-[--radius-card] border border-accent/40 bg-accent-soft/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{lesson.title}</p>
          <p className="mt-1 text-sm text-ink-muted text-pretty">{lesson.body}</p>
        </div>
        <Button
          variant="quiet"
          size="sm"
          className="compact min-h-9 shrink-0"
          onClick={() => dispatch({ type: 'dismissTutorial', id: lesson.id })}
        >
          Got it
        </Button>
      </div>
    </aside>
  )
}
