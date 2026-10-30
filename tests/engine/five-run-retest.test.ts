import { expect, it } from 'vitest'
import { newGame, applyAction, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { checkInvariants } from '@/game/engine/invariants'
import { tickObjectives } from '@/game/business/objectives'
import { functionStrain, nextFunctionMorale } from '@/game/team/capacity'
import { refreshScenarioAssessments } from '@/game/risk/review'
import { overallAssessment } from '@/game/debrief/assessment'
import { buildAnnualReview } from '@/game/debrief/review'
import { isReferenceMail, unreadUpdateCount, pushMessage } from '@/game/inbox/messages'
import { yearTimeline, openDecisions, cameBack } from '@/store/selectors'
import type { AnnualReviewDimension } from '@/game/types'
import { testIndex } from './helpers'

const index = testIndex()
function quiet() {
  const state = newGame(index, { seed: 'five-run-retest', difficulty: 'ciso' })
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  state.decisions.openIds = []
  return state
}
it('holds the played final day so a new decision can be answered before closure, without another tick', () => {
  const state = quiet()
  state.currentDay = 363
  state.pendingEffects = [{ id: 'last-question', source: 'test', day: 364, effects: [{ type: 'decision.open', decisionId: 'dec-q4-priorities' }] }]
  applyAction(state, index, { type: 'advance', days: 1, holdYearEnd: true })
  expect(state.currentDay).toBe(364)
  expect(state.finished).toBe(false)
  expect(checkInvariants(state, index)).toEqual([])
  expect(state.reviews.annual).toBeUndefined()
  const cursor = state.rngCursor
  expect(applyAction(state, index, { type: 'closeYear' }).ok).toBe(false)
  expect(state.rngCursor).toBe(cursor)
  const decision = state.decisions.decisions[state.decisions.openIds[0]!]!
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-q4-priorities-unknowns', rationaleTagIds: ['rat-more-evidence'] }).ok).toBe(true)
  expect(applyAction(state, index, { type: 'closeYear' }).ok).toBe(true)
  expect(state.currentDay).toBe(364)
  expect(state.finished).toBe(true)
  expect(decision.resolvedByDefault).toBe(false)
})
it('keeps unattended headless closure and explicit defaults separate from played closure', () => {
  const automatic = quiet(); automatic.currentDay = 363
  runDays(automatic, index, 1)
  expect(automatic.finished).toBe(true)
  const held = quiet(); held.currentDay = 364
  const decision = openDecision(held, index, 'dec-q4-priorities')!
  expect(applyAction(held, index, { type: 'closeYear', allowUnanswered: true }).ok).toBe(true)
  expect(decision.resolvedByDefault).toBe(true)
  expect(held.inbox.messages[0]!.body).toContain('You closed the year with this unanswered')
  expect(held.inbox.messages[0]!.body).not.toContain('The deadline passed')
})
it('lets idle teams recover with zero capacity or vacancies; overload still hurts and relief changes direction', () => {
  const state = quiet()
  const fn = state.team.functions.iam!
  Object.assign(fn, { capacity: 0, committed: 0, morale: 0.2, vacancies: 2 })
  expect(functionStrain(state, 'iam')).toBe(0)
  expect(nextFunctionMorale(state, 'iam')).toBeGreaterThan(fn.morale)
  Object.assign(fn, { capacity: 1, committed: 1 })
  expect(nextFunctionMorale(state, 'iam')).toBeLessThan(fn.morale)
  fn.capacity = 4
  expect(nextFunctionMorale(state, 'iam')).toBeGreaterThan(fn.morale)
})
it('fills the promised single identity vacancy after sixty days, not all five, and prevents duplicate recruitment', () => {
  const state = quiet()
  const fn = state.team.functions.iam!
  const before = fn.vacancies
  const decision = openDecision(state, index, 'dec-hire-or-outsource')!
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-hire-recruit', rationaleTagIds: [] }).ok).toBe(true)
  expect(fn.vacancies).toBe(before)
  runDays(state, index, 59)
  expect(fn.vacancies).toBe(before)
  runDays(state, index, 1)
  expect(fn.vacancies).toBe(before - 1)
  expect(state.inbox.messages.some((message) => message.body.includes('A new identity engineer has joined.'))).toBe(true)
  expect(applyAction(state, index, { type: 'hire', fn: 'iam' }).ok).toBe(true)
  const budget = state.resources.budgetRemaining
  expect(applyAction(state, index, { type: 'hire', fn: 'iam' }).ok).toBe(false)
  expect(state.resources.budgetRemaining).toBe(budget)
})
it('does not call an objective achieved after the original commitment even if the next progress tick would complete it', () => {
  const state = quiet()
  const objective = state.business.objectives['obj-platform-launch']!
  objective.status = 'active'; objective.progress = 0.99999
  state.currentDay = objective.targetDay + 1
  tickObjectives(state, index)
  expect(objective.status).toBe('failed')
})
it('does not average away weak business delivery while retaining equal weights and other ceilings', () => {
  const dimensions = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots'].map((id) => ({ id, label: id, band: id === 'business-enablement' ? 'weak' : 'strong' })) as AnnualReviewDimension[]
  expect(overallAssessment(dimensions, true)).toEqual({ label: 'Mixed', reason: 'business-enablement was weak' })
})
it('keeps a ninety-day renewal alive when only its assessment review becomes due', () => {
  const state = quiet()
  const risk = Object.values(state.risks.scenarios)[0]!
  risk.status = 'accepted'; risk.acceptedUntilDay = 100; risk.nextReviewDay = 12
  state.currentDay = 20
  expect(refreshScenarioAssessments(state, index).expiredAcceptances).not.toContain(risk.id)
  expect(risk.status).toBe('accepted')
  state.currentDay = 100
  expect(refreshScenarioAssessments(state, index).expiredAcceptances).toContain(risk.id)
})
it('excludes reference letters from update counts without deleting them and keeps old returns in Inbox', () => {
  const state = quiet(); state.inbox.messages = []
  const reference = pushMessage(state, { from: 'Office', subject: 'Reference', body: 'Background', type: 'business' })
  const signal = pushMessage(state, { from: 'SOC', subject: 'Signal', body: 'Check this', type: 'threat', signalCampaignId: 'test' })
  expect(isReferenceMail(state, index, reference)).toBe(true)
  expect(isReferenceMail(state, index, signal)).toBe(false)
  expect(unreadUpdateCount(state, index)).toBe(1)
  pushMessage(state, { from: 'Office', subject: 'Followed up: Old return', body: 'Still available', type: 'executive' })
  state.currentDay += 15
  expect(cameBack(state, index)).toHaveLength(0)
  expect(state.inbox.messages).toHaveLength(3)
})
it('labels paused programme spans accurately and allows delivered programmes to support priorities', () => {
  const state = quiet()
  const programme = state.programmes.programmes['prog-identity']!
  Object.assign(programme, { startedDay: 1, status: 'paused' })
  expect(yearTimeline(state, index).flatMap((lane) => lane.spans).find((span) => span.label === index.programme.get(programme.id)!.name)!.ending).toBe('paused')
  programme.status = 'complete'; programme.completedDay = 20; programme.progress = 1
  openDecision(state, index, 'dec-q4-priorities')
  expect(openDecisions(state, index).find((decision) => decision.defId === 'dec-q4-priorities')!.options.find((option) => option.id === 'opt-q4-priorities-programmes')!.affordable).toBe(true)
})
it('names an observed delayed consequence of a quiet fix in the annual account', () => {
  const state = quiet()
  // Resolve the actual authored option, independent of the title used in its report.
  const def = index.content.decisions.find((item) => item.options.some((option) => option.id === 'opt-card-fix'))!
  const runtime = openDecision(state, index, def.id)!
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: runtime.id, optionId: 'opt-card-fix', rationaleTagIds: [def.rationaleTagIds?.[0] ?? index.content.rationaleTags[0]!.id] }).ok).toBe(true)
  runDays(state, index, 120)
  expect(buildAnnualReview(state, index).narrative.join(' ')).toContain('Recorded cost of "Fix it quietly"')
})
