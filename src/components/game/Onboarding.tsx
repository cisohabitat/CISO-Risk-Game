/**
 * Teaching happens when a mechanic is first encountered, not in a tutorial
 * up front (plan §45). Notes are concise and dismissible for good.
 */
import { Button } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'

interface Lesson {
  id: string
  title: string
  body: string
  when: (context: { evidence: number; hypotheses: number; risks: number; programmes: number; day: number }) => boolean
}

const LESSONS: Lesson[] = [
  {
    id: 'lesson-evidence',
    title: 'Evidence is not risk',
    body: 'What you have just received is an observation. It becomes a risk only when you can say how it leads to business harm. The Risk screen is where you do that work.',
    when: (context) => context.evidence >= 2 && context.hypotheses === 0,
  },
  {
    id: 'lesson-hypothesis',
    title: 'Test the proposition',
    body: 'A hypothesis gives you something to gather evidence against. Some of what you find will contradict it, and that is the point.',
    when: (context) => context.hypotheses >= 1 && context.risks === 0,
  },
  {
    id: 'lesson-programme',
    title: 'Capability takes months',
    body: 'Controls do not improve because you approved something. Programmes run for months, need people you have already committed elsewhere, and hit blockers that money cannot clear.',
    when: (context) => context.day >= 14 && context.programmes === 0,
  },
  {
    id: 'lesson-attention',
    title: 'Your week is the scarce resource',
    body: 'Attention does not carry over. Spending it on everything means spending it on nothing that matters.',
    when: (context) => context.day >= 21,
  },
]

export function Onboarding() {
  const state = useGameStore((store) => store.state)
  const dispatch = useGameStore((store) => store.dispatch)
  if (!state) return null

  const context = {
    evidence: state.evidence.order.length,
    hypotheses: Object.keys(state.risks.hypotheses).length,
    risks: Object.values(state.risks.scenarios).filter((scenario) => scenario.status !== 'emerging').length,
    programmes: Object.values(state.programmes.programmes).filter((programme) => programme.status !== 'proposed').length,
    day: state.currentDay,
  }

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
