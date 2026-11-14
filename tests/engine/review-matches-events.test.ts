import { expect, it } from 'vitest'
import { buildAnnualReview } from '@/game/debrief/review'
import { newGame } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { testIndex } from './helpers'

// The 15-run playtest (November) found the review contradicting the year it
// was reading. Each case below is one of its examples.
const index = testIndex()
const dimension = (state: ReturnType<typeof newGame>, id: string) => buildAnnualReview(state, index).dimensions.find((item) => item.id === id)!

it('names the supplier breach instead of calling the year incident-free', () => {
  const state = newGame(index, { seed: 'supplier-breach-year' })
  state.events.firedEventIds.push('evt-org-hr-provider-incident')
  const narrative = dimension(state, 'resilience').narrative
  expect(narrative).not.toContain('No material incident')
  expect(narrative).toContain("the breach at People Cloud was the supplier's")
})

it('says what the board did not hear from the CISO', () => {
  const state = newGame(index, { seed: 'kept-quiet' })
  state.decisions.decisions['quiet'] = { id: 'quiet', defId: 'dec-sit-breach-extortion', createdDay: 30, selectedOptionId: 'opt-extortion-silent', resolvedDay: 31, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [] }
  const communication = dimension(state, 'communication')
  expect(communication.evidence).toContain('You did not tell the regulator about the extortion demand.')
  expect(communication.narrative).not.toContain('including when you told them what you did not know')
})

it('names the incident kinds after a breach year without ransomware', () => {
  const state = newGame(index, { seed: 'after-breach-other', situation: 'sit-after-breach' } as never)
  const wiper = index.content.incidentFamilies.find((family) => !/ransom/i.test(family.id))!
  const incident = createIncident(state, index, { familyId: wiper.id })!
  incident.phase = 'closed'
  const close = buildAnnualReview(state, index).narrative.join(' ')
  expect(close).not.toContain('of other kinds')
  expect(close).toContain(`this year it was ${wiper.name.toLowerCase()}`)
})
