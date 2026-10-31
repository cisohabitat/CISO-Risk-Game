import { expect, it } from 'vitest'
import { buildAnnualReview } from '@/game/debrief/review'
import { newGame } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { discoveryCounts, undiscoveredMaterial } from '@/game/knowledge/discovery'
import { testIndex } from './helpers'

const index = testIndex()
it('distinguishes real incident outcomes from a separate restore exercise without changing its grade', () => {
  const state = newGame(index, { seed: 'incident-not-exercise' })
  const incident = createIncident(state, index, { familyId: index.content.incidentFamilies[0]!.id })!
  incident.phase = 'closed'; incident.consequence = 0.1
  const before = structuredClone(state)
  const dimension = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'resilience')!
  expect(dimension.band).toBe('strong')
  expect(dimension.evidence).toContain('No separate recovery exercise was recorded. This assessment uses the incident outcomes above; it does not demonstrate a rehearsed restore.')
  expect(dimension.evidence).not.toContain('Recovery was never exercised')
  expect(state).toEqual(before)
})
it('reconciles material hidden dependencies with the larger all-dependency total', () => {
  const state = newGame(index, { seed: 'material-subset' })
  for (const node of Object.values(state.organisation.nodes)) node.discovered = true
  for (const edge of Object.values(state.organisation.edges)) edge.discovered = false
  const total = discoveryCounts(state).dependencies.remaining
  const material = undiscoveredMaterial(state, index).dependencies.length
  const dimension = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'blind-spots')!
  expect(total).toBeGreaterThan(material)
  expect(dimension.evidence.join(' ')).toContain(`subset of ${total} undiscovered dependencies in total`)
})
