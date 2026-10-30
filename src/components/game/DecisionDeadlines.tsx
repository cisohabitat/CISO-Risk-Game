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
  const screen = useGameStore((store) => store.ui.screen)
  if (!state || state.finished) return null
  const skipHeld = state.pauseReasons.includes('pending-decision')
  const due = openDecisions(state, index).filter((decision) => skipHeld || (decision.daysRemaining !== undefined && decision.daysRemaining <= 3))
  const quarter = state.reviews.pendingQuarter
  const boardDeadline = quarter === undefined ? undefined : (quarter + 1) * DAYS_PER_QUARTER - 1
  const boardDue = boardDeadline !== undefined && boardDeadline - state.currentDay <= 7
  const visible = due.length > 0 || quarter !== undefined
  return <div aria-label="Decision deadlines" className={visible ? 'mb-4 rounded-lg border border-band-high/50 bg-band-high-soft p-3' : undefined} role="status">
    {due.length > 0 && <p className="font-medium">{skipHeld ? 'Skip ahead is held for a waiting decision' : 'Work approaching its deadline'}</p>}
    {quarter !== undefined && <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>Q{quarter} board paper ready · reports Q{quarter} results · submit by {shortDate(boardDeadline!)}{boardDue ? ` · ${state.currentDay === boardDeadline ? 'due today' : `in ${boardDeadline! - state.currentDay} days`}` : ''}. A draft is not a submission.</span>
      <Button variant="secondary" size="sm" onClick={() => useGameStore.getState().setScreen('board')}>Review board paper</Button>
    </div>}
    {due.length > 0 && <p className="mt-1 text-sm">Pause time to review them. Unanswered decisions will be taken out of your hands at their deadline.</p>}
    {due.length > 0 && <ul className="mt-2 space-y-2">{due.map((decision) => <li key={decision.id} className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{decision.title} · {decision.daysRemaining === undefined ? 'no fixed deadline' : decision.daysRemaining <= 0 ? 'due today' : `due in ${decision.daysRemaining} day${decision.daysRemaining === 1 ? '' : 's'}`}</span>
      <Button variant="secondary" size="sm" onClick={() => setUi({ openDecisionId: decision.id })}>{skipHeld && screen !== 'home' ? 'Decide' : 'Review'}: {decision.title}</Button>
    </li>)}</ul>}
  </div>
}
