import { Button } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { programmeCommitments } from '@/store/commitments'
import { minimumProgrammeFunding } from '@/game/programmes/funding'
import { money, shortDate } from '@/lib/formatting/labels'

export function ProgrammePromiseQuote({ programmeId, reviewAfterDays }: { programmeId: string; reviewAfterDays: number }) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const programme = index.programme.get(programmeId)
  if (!state || !programme) return null
  const minimum = minimumProgrammeFunding(programme.budgetCost)
  return <span className="mt-3 block rounded border border-line bg-surface p-3 text-sm">
    <span className="block font-medium">Follow-through: {programme.name}</span>
    <span className="mt-1 block">Minimum to start {money(minimum)} · full funding {money(programme.budgetCost)} · currently available {money(Math.max(0, state.resources.budgetRemaining))}.</span>
    <span className="mt-1 block">Already allocated: {money(state.programmes.programmes[programmeId]?.budgetAllocated ?? 0)}.</span>
    <span className="mt-1 block">This reply reserves no money or staffing. Review the actual allocation and delivery plan in Programmes. A funding/progress review follows in {reviewAfterDays} days; this is not its completion deadline.</span>
    {state.resources.budgetRemaining < minimum && state.programmes.programmes[programmeId]?.status === 'proposed' && <span className="mt-1 block font-medium text-band-high">The minimum allocation is currently unaffordable. Recording a promise does not remove that gap.</span>}
  </span>
}

export function ProgrammeCommitments() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state) return null
  const commitments = programmeCommitments(state, index)
  if (commitments.length === 0) return null
  return <section aria-label="Recorded commitments" className="rounded-lg border border-line bg-surface p-3">
    <h2 className="font-display text-xl">Recorded commitments</h2>
    <ul className="mt-3 space-y-3">{commitments.map((item) => <li key={item.id} className="text-sm">
      <p className="font-medium">{item.programmeName} · {item.status}</p>
      <p className="mt-1 text-ink-muted">Recorded in “{item.title}”, Year {item.year}. {item.reviewDay === undefined ? 'The historical selection is retained, but its date and whether it was chosen by default were not recorded.' : <>Review {item.proposed && state.currentDay >= item.reviewDay ? 'due since' : 'scheduled for'} {shortDate(item.reviewDay)}; review date, not completion date.</>}</p>
      <p className="mt-1">Allocated {money(item.allocated)} · minimum start {money(item.minimum)} · full funding {money(item.fullCost)}.</p>
      {item.proposed && <p className="mt-1 text-band-high">No programme has started against this promise.{item.shortfall > 0 ? ` The minimum start needs ${money(item.shortfall)} more than the budget currently available.` : ' Funding and staffing still need to be arranged.'}</p>}
      <Button variant="quiet" size="sm" className="mt-2" onClick={() => { useGameStore.getState().setUi({ selectedProgrammeId: item.programmeId }); useGameStore.getState().setScreen('programmes') }}>Review programme funding</Button>
    </li>)}</ul>
  </section>
}
