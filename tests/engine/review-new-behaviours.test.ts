import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { newGame } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { buildAnnualReview } from '@/game/debrief/review'

// 19 November: the review reads what the game now teaches: telling the board
// first, and the business's security checks.
it('names how the board heard of each incident, and caps a board that heard elsewhere', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'review-new' })
  state.currentDay = 363
  state.stakeholders.boardConfidence = 0.95
  for (const quarter of [1, 2, 3]) state.reviews.quarters.push({ quarter, day: quarter * 91, topicsChosen: [], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
  const briefed = createIncident(state, index, { familyId: 'fam-data-breach', pathId: 'path-portal-credential' })!
  briefed.phase = 'closed'; briefed.boardInformedDay = 40
  let review = buildAnnualReview(state, index)
  let communication = review.dimensions.find((d) => d.id === 'communication')!
  expect(communication.evidence.join(' ')).toContain('You briefed the board on the')
  expect(communication.band).toBe('strong')
  const missed = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
  missed.phase = 'closed'; missed.boardHeardElsewhereDay = 200
  review = buildAnnualReview(state, index)
  communication = review.dimensions.find((d) => d.id === 'communication')!
  expect(communication.evidence.join(' ')).toContain('The board heard about the ransomware and service encryption of')
  expect(communication.band).not.toBe('strong')
})

it('names each security check in business enablement', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'review-gates' })
  state.currentDay = 363
  state.business.objectives['obj-platform-launch']!.gate = 'met'
  state.business.objectives['obj-acquisition']!.gate = 'unmet'
  state.business.objectives['obj-new-market']!.gate = 'met'
  const enablement = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'business-enablement')!
  expect(enablement.evidence.join(' | ')).toContain('Launch the new customer platform: the go-live review cleared it')
  expect(enablement.evidence.join(' | ')).toContain('Complete and integrate the Kestrel acquisition: held by the integration auditors, 45 days lost')
  expect(enablement.evidence.join(' | ')).toContain('Enter the Nordic market: the Nordic acquiring bank cleared it')
  expect(enablement.narrative).toContain('held at a security check')
})

it('reads a reassurance that did not hold as the board misled', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'review-reassure' })
  state.currentDay = 363
  const incident = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
  incident.phase = 'closed'; incident.consequence = 0.7; incident.boardInformedDay = 50; incident.boardBriefingTone = 'reassuring'
  const communication = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'communication')!
  expect(communication.evidence.join(' ')).toContain('was in hand, and it was not')
  expect(communication.band).not.toBe('strong')
})

// 16fe0ee playtest: concealment sat beside "strong" communication (M-11), and
// "strong" business enablement beside a missed objective (m-13).
it('caps communication below strong when something was kept quiet, and enablement when an objective was missed', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'review-caps' })
  state.currentDay = 363
  state.stakeholders.boardConfidence = 0.95
  for (const quarter of [1, 2, 3]) state.reviews.quarters.push({ quarter, day: quarter * 91, topicsChosen: [], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
  expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'communication')!.band).toBe('strong')
  state.decisions.decisions['quiet'] = { id: 'quiet', defId: 'dec-cardholder-scope', createdDay: 100, selectedOptionId: 'opt-card-fix', resolvedDay: 101, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [] }
  expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'communication')!.band).not.toBe('strong')
  for (const objective of Object.values(state.business.objectives)) objective.status = 'achieved'
  state.business.objectives['obj-new-market']!.status = 'failed'
  expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'business-enablement')!.band).not.toBe('strong')
})
