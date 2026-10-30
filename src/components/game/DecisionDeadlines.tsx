import { DAYS_PER_QUARTER } from '@/game/types'
import { shortDate } from '@/lib/formatting/labels'
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
  const quarter = state.reviews.pendingQuarter
  const boardDeadline = quarter === undefined ? undefined : (quarter + 1) * DAYS_PER_QUARTER - 1
  const boardDue = boardDeadline !== undefined && boardDeadline - state.currentDay <= 7
  if (due.length === 0 && !boardDue) return null
  return <aside aria-label="Decision deadlines" className="mb-4 rounded-lg border border-band-high/50 bg-band-high-soft p-3" role="status">
    <p className="font-medium">Work approaching its deadline</p>
    {boardDue && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>Q{quarter} board paper · submit by {shortDate(boardDeadline!)} · {state.currentDay > boardDeadline! ? 'overdue' : state.currentDay === boardDeadline ? 'due today' : `in ${boardDeadline! - state.currentDay} days`}. A draft is not a submission.</span>
      <Button variant="secondary" size="sm" onClick={() => useGameStore.getState().setScreen('board')}>Review board paper</Button>
    </div>}
    <p className="mt-1 text-sm">Pause time to review them. Unanswered decisions will be taken out of your hands at their deadline.</p>
    <ul className="mt-2 space-y-2">{due.map((decision) => <li key={decision.id} className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{decision.title} · {decision.daysRemaining! <= 0 ? 'due today' : `due in ${decision.daysRemaining} day${decision.daysRemaining === 1 ? '' : 's'}`}</span>
      <Button variant="secondary" size="sm" onClick={() => setUi({ openDecisionId: decision.id })}>Review: {decision.title}</Button>
    </li>)}</ul>
  </aside>
}
