import { expect, it } from 'vitest'
import { buildAnnualReview } from '@/game/debrief/review'
import { newGame } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { testIndex } from './helpers'

// A practitioner's ransomware year closed with services restored, and the
// review still said the incident "was still running when the year was written
// up": restored services wait a day in debrief before the incident closes.
const index = testIndex()
const ransomware = index.content.incidentFamilies.find((family) => /ransom/i.test(family.id))!.id

function resilience(phase: 'containment' | 'recovery' | 'debrief', recovery: number): string {
  const state = newGame(index, { seed: `still-running-${phase}-${recovery}` })
  const incident = createIncident(state, index, { familyId: ransomware })!
  incident.phase = phase
  incident.recovery = recovery
  incident.consequence = 0.2
  return buildAnnualReview(state, index).dimensions.find((item) => item.id === 'resilience')!.narrative
}

it('does not call an incident running once its services are restored', () => {
  expect(resilience('debrief', 1)).not.toContain('still running')
  expect(resilience('recovery', 0.96)).not.toContain('still running')
})

it('still says so while the business is affected', () => {
  expect(resilience('containment', 0)).toContain('still running')
  expect(resilience('recovery', 0.5)).toContain('still running')
})
