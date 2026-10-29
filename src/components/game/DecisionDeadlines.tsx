import { Button } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { openDecisions } from '@/store/selectors'

/** Keep impending deadlines visible on every workspace, including after Resume. */
export function DecisionDeadlines() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const setUi = useGameStore((store) => store.setUi)
  if (!state || state.finished) return null
  const due = openDecisions(state, index).filter((decision) => decision.daysRemaining !== undefined && decision.daysRemaining <= 3)
  if (due.length === 0) return null
  return <aside aria-label="Decision deadlines" className="mb-4 rounded-lg border border-band-high/50 bg-band-high-soft p-3" role="status">
    <p className="font-medium">Decisions approaching their deadline</p>
    <p className="mt-1 text-sm">Pause time to review them. Unanswered decisions will be taken out of your hands at their deadline.</p>
    <ul className="mt-2 space-y-2">{due.map((decision) => <li key={decision.id} className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{decision.title} · {decision.daysRemaining! <= 0 ? 'due today' : `due in ${decision.daysRemaining} day${decision.daysRemaining === 1 ? '' : 's'}`}</span>
      <Button variant="secondary" size="sm" onClick={() => setUi({ openDecisionId: decision.id })}>Review: {decision.title}</Button>
    </li>)}</ul>
  </aside>
}
