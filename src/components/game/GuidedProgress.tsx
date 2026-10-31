import { Button } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { objectivePace } from '@/game/business/pace'
import { DAYS_PER_QUARTER } from '@/game/types'
import { formatGameDate } from '@/game/time'

export function DeliveryWatch() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state || state.finished) return null
  const slipping = index.content.objectives.filter((def) => objectivePace(state, index, def.id)?.atRisk)
  if (slipping.length === 0) return null
  return <aside aria-label="Business delivery watch" className="rounded-lg border border-band-elevated/50 p-3 text-sm">
    <p className="font-medium">Business dates need a look</p>
    <p className="mt-1">At the average pace observed so far, these original dates look at risk: {slipping.map((def) => def.name).join('; ')}. This is a watchpoint, not a new decision. Pace can change; running more security work and imposing delays can use up delivery time.</p>
    <Button variant="secondary" size="sm" className="mt-2" onClick={() => { const tracker = document.getElementById('objective-tracker'); tracker?.scrollIntoView({ block: 'start' }); tracker?.focus({ preventScroll: true }) }}>Review business dates</Button>
  </aside>
}

export function GuidedExploration() {
  const state = useGameStore((store) => store.state)
  if (!state || state.finished || !DIFFICULTY_PROFILES[state.difficulty].showsDecisionCoaching) return null
  const unchecked = [...Object.values(state.organisation.nodes), ...Object.values(state.organisation.edges)].filter((item) => item.exists && item.discovered && !item.verified).length
  const returned = state.team.assignments.filter((assignment) => assignment.kind === 'investigation' && assignment.status === 'complete').length
  const explore = state.currentDay >= 21 && unchecked > 0
  const boardSoon = state.currentDay >= 70 && state.currentDay < DAYS_PER_QUARTER
  if (!explore && !boardSoon) return null
  return <aside aria-label="Next checks on Guided" className="rounded-lg border border-line p-3 text-sm">
    {explore && <><p className="font-medium">One report does not cover the whole organisation</p><p className="mt-1">{returned} {returned === 1 ? 'enquiry has' : 'enquiries have'} returned. {unchecked} {unchecked === 1 ? 'visible system or dependency still has' : 'visible systems and dependencies still have'} not been independently examined. Choose another area you are relying on; completing every enquiry is not a requirement or a guarantee of a strong year.</p><Button variant="secondary" size="sm" className="mt-2" onClick={() => { useGameStore.getState().setScreen('risk'); useGameStore.getState().setUi({ riskTab: 'investigate' }) }}>Choose the next enquiry</Button></>}
    {boardSoon && <p className="mt-2">The first board paper opens after the 13-week reporting period, in Week 14 on {formatGameDate(DAYS_PER_QUARTER).label}. Use the time to assess and raise the risks you want to report.</p>}
  </aside>
}
