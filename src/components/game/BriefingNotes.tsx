import { Button, Disclosure } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { minimumProgrammeFunding } from '@/game/programmes/funding'
import { money, shortDate } from '@/lib/formatting/labels'

export function BudgetActivity() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state) return null
  const entries = state.history.entries.filter((entry) => entry.kind === 'budget').slice(-20).reverse()
  const example = index.content.programmes.find((programme) => state.programmes.programmes[programme.id]?.status === 'proposed' && minimumProgrammeFunding(programme.budgetCost) <= state.resources.budgetRemaining)
  return <div className="space-y-2"><p role="note" aria-label="Budget reserve guidance" className="text-sm text-ink-muted">This allocation has to last through later decisions and programme constraints. Keep a reserve; spending it all in January narrows your later choices.</p><p className="text-sm text-ink-muted">{example ? `An available funding quote: ${example.name} needs ${money(minimumProgrammeFunding(example.budgetCost))} minimum to start, or ${money(example.budgetCost)} in full. This is an example, not a recommendation; it still needs attention and staffing.` : 'No unstarted programme fits the remaining minimum funding. Existing work, enquiries and future obligations still need review.'} <Button variant="quiet" size="sm" onClick={() => useGameStore.getState().setScreen('programmes')}>Compare programme quotes</Button></p><Disclosure summary="Budget movements">
    <p className="text-sm">Available today: {money(state.resources.budgetRemaining)}. These are recorded changes, including refunds and imposed cuts. Earlier correspondence can quote a different date or allocation.</p>
    {entries.length === 0 ? <p className="mt-2 text-sm text-ink-muted">No changes have been recorded in this ledger. Older saves do not reconstruct past transactions.</p> : <ol className="mt-3 space-y-2 text-sm">{entries.map((entry, i) => <li key={`${entry.day}-${i}`}><span className="text-ink-muted">{shortDate(entry.day)} · </span>{entry.summary}</li>)}</ol>}
    <p className="mt-2 text-xs text-ink-muted">Latest 20 retained entries; this is an activity record, not a full accounting ledger.</p>
  </Disclosure>{entries[0] && <p className="text-xs text-ink-muted" role="note" aria-label="Latest budget movement">Latest recorded change, {shortDate(entries[0].day)}: {entries[0].summary}</p>}</div>
}

export function QuietWeekNote() {
  const state = useGameStore((store) => store.state)
  if (!state || state.finished || state.currentDay < 14 || state.decisions.openIds.length > 0 || state.incidents.order.some((id) => state.incidents.incidents[id]?.phase !== 'closed')) return null
  const lastDecision = Math.max(0, ...Object.values(state.decisions.decisions).map((decision) => decision.createdDay))
  if (state.currentDay - lastDecision < 7) return null
  const running = Object.values(state.programmes.programmes).filter((programme) => programme.status === 'active' || programme.status === 'at-risk').length
  const enquiries = state.team.assignments.filter((assignment) => assignment.status === 'running').length
  return <aside aria-label="A quieter week" className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
    <p className="font-medium">A quieter week for decisions</p>
    <p className="mt-1">No new decision has arrived in the last seven days. {running} programmes and {enquiries} enquiries are running. {state.reviews.pendingQuarter === undefined ? 'Use the space to review evidence, owners and upcoming risk reviews.' : `The Q${state.reviews.pendingQuarter} board paper still needs submission.`} A quiet decision list does not establish that risk has fallen.</p>
  </aside>
}
