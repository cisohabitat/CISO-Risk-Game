import { expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { adoptedAppetite, appetiteExceptions, appetitePosition } from '@/game/risk/appetite'
import { buildQuarterReview } from '@/game/debrief/quarter'
import { finishYear } from '@/game/debrief/review'
import { createNextYear } from '@/game/engine/next-year'
import { messageReturnKind } from '@/game/inbox/returns'
import { tickDay } from '@/game/engine/tick'
import { testIndex } from './helpers'

const index = testIndex()
function adopt(optionId = 'opt-appetite-moderate') {
  const state = newGame(index, { seed: 'appetite-loop' })
  const decision = openDecision(state, index, 'dec-board-appetite')!
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId, rationaleTagIds: ['rat-material'] }).ok).toBe(true)
  return state
}

it('opens the discussion from the existing letter without adding it to the random pool', () => {
  const state = newGame(index, { seed: 'appetite-letter' })
  state.events.scheduled.push({ eventId: 'evt-biz-board-appetite', day: state.currentDay + 1 })
  tickDay(state, index)
  expect(state.events.scheduled.some((event) => event.eventId === 'evt-con-appetite-discussion')).toBe(true)
  tickDay(state, index)
  expect(state.decisions.openIds.some((id) => state.decisions.decisions[id]!.defId === 'dec-board-appetite')).toBe(true)
  expect(index.event.get('evt-con-appetite-discussion')!.scheduledOnly).toBe(true)
})
it('records governance without buying control improvement or spending programme funds', () => {
  const state = newGame(index, { seed: 'appetite-scope' })
  const original = structuredClone({ budget: state.resources, controls: state.controls, programmes: state.programmes })
  const decision = openDecision(state, index, 'dec-board-appetite')!
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-appetite-moderate', rationaleTagIds: [] }).ok).toBe(false)
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-appetite-moderate', rationaleTagIds: ['rat-material'] }).ok).toBe(true)
  expect({ budget: state.resources, controls: state.controls, programmes: state.programmes }).toEqual(original)
  expect(adoptedAppetite(state, index)?.policy.delegatedResidualCeiling).toBe('moderate')
})
it('compares recorded public assessments, distinguishing unassessed from within appetite', () => {
  const strict = adopt()
  const delegated = adopt('opt-appetite-elevated')
  const risk = Object.values(strict.risks.scenarios)[0]!
  risk.status = 'accepted'
  risk.lastAssessed = { day: strict.currentDay, residual: 0.26, exposure: 0.3, consequence: 0.4 }
  expect(appetitePosition(risk, adoptedAppetite(strict, index)!)).toBe('outside')
  expect(appetitePosition(risk, adoptedAppetite(delegated, index)!)).toBe('within')
  expect(appetiteExceptions(strict, index).map((item) => item.id)).toContain(risk.id)
  risk.lastAssessed = null
  expect(appetitePosition(risk, adoptedAppetite(strict, index)!)).toBe('unassessed')
  expect(appetiteExceptions(strict, index)[0]!.position).toBe('unassessed')
  risk.status = 'closed'
  expect(appetiteExceptions(strict, index)).toHaveLength(0)
})
it('names omitted exceptions and distinguishes reporting from approval without a second penalty', () => {
  const state = adopt()
  const risk = Object.values(state.risks.scenarios)[0]!
  risk.status = 'accepted'
  risk.lastAssessed = { day: state.currentDay, residual: 0.3, exposure: 0.3, consequence: 0.4 }
  const before = JSON.stringify(state)
  const omitted = buildQuarterReview(state, index, { quarter: 1, topics: [], recommendations: [], communicateUncertainty: false })
  expect(omitted.boardReaction).toContain('appetite statement also needed an exception discussion')
  expect(omitted.boardReaction).toContain(index.riskScenario.get(risk.id)!.title)
  expect(omitted.effects.filter((effect) => effect.type === 'board.confidence')).toEqual([{ type: 'board.confidence', delta: -0.06 }])
  const covered = buildQuarterReview(state, index, { quarter: 1, topics: [`risk:${risk.id}`], recommendations: [], communicateUncertainty: false })
  expect(covered.boardReaction).toContain('does not establish approval')
  expect(JSON.stringify(state)).toBe(before)
})
it('retains the adopted statement across a year boundary and a deferred replacement', () => {
  const state = adopt()
  state.currentDay = 364
  state.finished = true
  finishYear(state, index)
  const next = createNextYear(index, state)
  expect(adoptedAppetite(next, index)).toMatchObject({ year: 1, policy: { delegatedResidualCeiling: 'moderate' } })
  expect(adoptedAppetite(next, index)?.day).toBeUndefined()
  const decision = openDecision(next, index, 'dec-board-appetite')!
  expect(applyAction(next, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-appetite-defer', rationaleTagIds: ['rat-material'] }).ok).toBe(true)
  expect(adoptedAppetite(next, index)?.year).toBe(1)
})
it.each([true, false])('checks current acceptances at the scheduled review (accepted=%s)', (accepted) => {
  const state = adopt()
  for (const id of [...state.decisions.openIds]) {
    const def = index.decision.get(state.decisions.decisions[id]!.defId)!
    applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: def.options[0]!.id, rationaleTagIds: def.rationaleTagIds?.slice(0, 1) ?? [] })
  }
  const day = state.currentDay + 30
  const risk = Object.values(state.risks.scenarios)[0]!
  risk.status = accepted ? 'accepted' : 'open'
  risk.acceptedUntilDay = day + 60
  state.currentDay = day - 1
  const expected = accepted ? 'evt-con-appetite-accepted' : 'evt-con-appetite-no-acceptances'
  const other = accepted ? 'evt-con-appetite-no-acceptances' : 'evt-con-appetite-accepted'
  // Isolate this scheduled review from earlier spine messages in the day-jump fixture.
  state.events.suppressedEventIds = index.content.events.filter((event) => event.id !== expected && event.id !== other).map((event) => event.id)
  // The shared follow-up classifier must stop a skip even for read ordinary mail.
  const advanced = applyAction(state, index, { type: 'advance', days: 5, stopOnUpdate: true })
  expect(advanced.ticks).toHaveLength(1)
  expect(advanced.message).toBe(`Update received: ${index.event.get(expected)!.title}`)
  expect(state.events.firedEventIds).toContain(expected)
  expect(messageReturnKind(state.inbox.messages.find((message) => message.eventId === expected)!, index)).toBe('consequence')
  expect(state.events.firedEventIds).not.toContain(other)
})
it('records a lapsed request as a default, with no invented adoption', () => {
  const state = newGame(index, { seed: 'appetite-default' })
  const decision = openDecision(state, index, 'dec-board-appetite')!
  runDays(state, index, 45)
  expect(decision.resolvedByDefault).toBe(true)
  expect(adoptedAppetite(state, index)).toBeUndefined()
  expect(state.events.firedEventIds).toContain('evt-con-appetite-deferred')
})
