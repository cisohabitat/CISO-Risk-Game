import { expect, it } from 'vitest'
import { CAMPAIGN_DAYS, DAYS_PER_QUARTER } from '@/game/types'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'
import { boardPaperCounts } from '@/game/debrief/papers'
import { buildAnnualReview } from '@/game/debrief/review'
import { undiscoveredMaterial } from '@/game/knowledge/discovery'
import { openDecision } from '@/game/decisions/open'
import { tickDay } from '@/game/engine/tick'
import { evaluateAll } from '@/game/events/conditions'

it('reconciles all three paper windows even if a legacy missed counter disagrees', () => {
  const state = newGame(testIndex(), { seed: 'paper-counts' })
  state.currentDay = CAMPAIGN_DAYS
  state.finished = true
  state.reviews.missedQuarters = 2
  expect(boardPaperCounts(state)).toEqual({ offered: 3, submitted: 0, missed: 3, awaiting: 0 })
  const paper = { quarter: 1, day: 91, completed: true, topicsChosen: [], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '' }
  state.reviews.quarters = [paper, { ...paper }]
  expect(boardPaperCounts(state)).toEqual({ offered: 3, submitted: 1, missed: 2, awaiting: 0 })
  const review = buildAnnualReview(state, testIndex())
  const communication = review.dimensions.find((item) => item.id === 'communication') ?? review.dimensions.find((item) => item.label === 'Communication and escalation')!
  expect(communication.evidence).toContain('1 quarterly review submitted; 3 offered')
  expect(communication.evidence).toContain('2 board papers missed at the submission deadline')
})
it('does not count a pending window as missed before its actual boundary', () => {
  const state = newGame(testIndex(), { seed: 'pending-papers' })
  state.currentDay = 2 * DAYS_PER_QUARTER - 1
  expect(boardPaperCounts(state)).toEqual({ offered: 1, submitted: 0, missed: 0, awaiting: 1 })
  state.currentDay = 2 * DAYS_PER_QUARTER
  expect(boardPaperCounts(state)).toEqual({ offered: 2, submitted: 0, missed: 1, awaiting: 1 })
})
it('separates hidden dependencies from a fully discovered system inventory', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'system-edge-counts' })
  for (const node of Object.values(state.organisation.nodes)) if (node.exists) node.discovered = true
  for (const edge of Object.values(state.organisation.edges)) edge.discovered = false
  const unseen = undiscoveredMaterial(state, index)
  expect(unseen.systems).toHaveLength(0)
  expect(unseen.dependencies.length).toBeGreaterThan(0)
  const dimension = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'blind-spots')!
  expect(dimension.evidence.some((line) => line.includes('dependencies were never discovered, separately from the system count'))).toBe(true)
  expect(dimension.evidence.some((line) => line.includes('systems and dependencies'))).toBe(false)
})
it('delivers an unfunded-promise consequence only while the programme is unstarted', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'promise-guard' })
  state.flags['audit.committed'] = true
  const event = index.event.get('evt-con-audit-funding-missing')!
  expect(evaluateAll(state, index, event.conditions)).toBe(true)
  state.programmes.programmes['prog-identity']!.status = 'active'
  expect(evaluateAll(state, index, event.conditions)).toBe(false)
  expect(event.scheduledOnly).toBe(true)
})

it('pauses before the board deadline and retains the same lapse boundary', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'board-warning-pause' })
  state.currentDay = 2 * DAYS_PER_QUARTER - 3
  state.reviews.pendingQuarter = 1
  state.decisions.openIds = []
  state.paused = false
  state.speed = '4x'
  expect(tickDay(state, index).pauseReasons).toContain('board-decision')
  expect(state.paused).toBe(true)
  tickDay(state, index)
  expect(state.reviews.missedQuarters ?? 0).toBe(0)
  tickDay(state, index)
  expect(state.reviews.missedQuarters).toBe(1)
})

it('records the promise without buying it and delivers the scheduled consequence', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'real-audit-promise' })
  const decision = openDecision(state, index, 'dec-audit-finding')!
  const def = index.decision.get(decision.defId)!
  const budget = state.resources.budgetRemaining
  const reviewDay = state.currentDay + 100
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-audit-programme', rationaleTagIds: [def.rationaleTagIds?.[0] ?? 'rat-more-evidence'] }).ok).toBe(true)
  expect(state.resources.budgetRemaining).toBe(budget)
  expect(state.programmes.programmes['prog-identity']!.status).toBe('proposed')
  expect(state.events.scheduled.some((event) => event.eventId === 'evt-con-audit-funding-missing' && event.day === reviewDay)).toBe(true)
  const funded = structuredClone(state)
  expect(applyAction(funded, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: index.programme.get('prog-identity')!.budgetCost }).ok).toBe(true)
  for (const current of [state, funded]) {
    current.currentDay = reviewDay - 1
    tickDay(current, index)
  }
  expect(state.events.firedEventIds).toContain('evt-con-audit-funding-missing')
  expect(funded.events.firedEventIds).not.toContain('evt-con-audit-funding-missing')
  expect(state.inbox.messages.some((message) => message.eventId === 'evt-con-audit-funding-missing')).toBe(true)
  expect(state.stakeholders.boardConfidence).toBeLessThan(funded.stakeholders.boardConfidence)
})
