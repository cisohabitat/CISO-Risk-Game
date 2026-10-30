import { expect, it } from 'vitest'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { tickDay } from '@/game/engine/tick'
import { nextFunctionMorale } from '@/game/team/capacity'
import { teamView, programmeViews } from '@/store/selectors'
import { collisions } from '@/store/selectors'
import { openDecision } from '@/game/decisions/open'
import { tickObjectives } from '@/game/business/objectives'
import { testIndex } from './helpers'

const index = testIndex()
function quiet() {
  const state = newGame(index, { seed: 'skip-public-updates' })
  state.currentDay = 240
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  state.decisions.openIds = []
  state.incidents = { incidents: {}, order: [], counter: 0 }
  state.pendingEffects = []
  return state
}
it('stops for recorded refunds and explains a 105 to 255 budget path without inventing money', () => {
  const state = quiet()
  state.resources.budgetRemaining = 105
  state.pendingEffects.push(
    { id: 'licence-return', day: 242, source: 'test', effects: [{ type: 'budget.change', amount: 60, note: 'An unused licence has been cancelled.' }] },
    { id: 'duplicate-return', day: 244, source: 'test', effects: [{ type: 'budget.change', amount: 90, note: 'A duplicate tool has been cancelled.' }] },
  )
  expect(applyAction(state, index, { type: 'advance', days: 30, stopOnUpdate: true }).message).toContain('£105k to £165k')
  expect(state.currentDay).toBe(242)
  expect(applyAction(state, index, { type: 'advance', days: 30, stopOnUpdate: true }).message).toContain('£165k to £255k')
  expect(state.currentDay).toBe(244)
  expect(state.history.entries.filter((entry) => entry.kind === 'budget')).toHaveLength(2)
})
it('records slow completion around an unpaid constraint without charging for the fix', () => {
  const state = quiet()
  const programme = state.programmes.programmes['prog-identity']!
  Object.assign(programme, { status: 'at-risk', startedDay: 1, progress: 0.99999, budgetAllocated: 850, blockers: [{ id: 'blk-identity-legacy', startedDay: 100, resolved: false }] })
  state.resources.budgetRemaining = 105
  tickDay(state, index)
  expect(programme.status).toBe('complete')
  expect(state.resources.budgetRemaining).toBe(105)
  expect(programmeViews(state, index).find((item) => item.id === programme.id)!.latestBlockerNote).toContain('completion did not purchase a separate blocker fix')
  expect(state.inbox.messages.find((message) => message.subject.startsWith('Delivered: Identity'))!.body).toContain('Legacy applications cannot federate')
})
it('records actual manual clearing once, while a refused paid fix records nothing', () => {
  const state = quiet()
  const programme = state.programmes.programmes['prog-identity']!
  programme.blockers = [{ id: 'blk-identity-exec', startedDay: 200, resolved: false }, { id: 'blk-identity-legacy', startedDay: 200, resolved: false }]
  programme.status = 'at-risk'
  state.resources.budgetRemaining = 105
  state.resources.focusRemaining = 5
  expect(applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: 'blk-identity-exec' }).ok).toBe(true)
  const notes = state.history.entries.filter((entry) => entry.kind === 'programme-blocker')
  expect(notes).toHaveLength(1)
  expect(notes[0]!.summary).toContain('A change freeze over the quarter close cleared')
  expect(applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: 'blk-identity-legacy' }).ok).toBe(false)
  expect(state.history.entries.filter((entry) => entry.kind === 'programme-blocker')).toHaveLength(1)
})
it('keeps zero-load recovery and fractional-load decline consistent with the displayed commitment', () => {
  const state = quiet()
  const engineering = state.team.functions.engineering!
  Object.assign(engineering, { capacity: 4, committed: 0, vacancies: 0, morale: 0.5 })
  expect(nextFunctionMorale(state, 'engineering')).toBeGreaterThan(engineering.morale)
  expect(teamView(state, index).functions.find((fn) => fn.fn === 'engineering')!.recoveryNote).toContain('Recovering slowly')
  Object.assign(engineering, { capacity: 0.05, committed: 0.04 })
  expect(nextFunctionMorale(state, 'engineering')).toBeLessThan(engineering.morale)
  expect(teamView(state, index).functions.find((fn) => fn.fn === 'engineering')!.committed).toBe(0.04)
  Object.assign(engineering, { capacity: 0, committed: 0 })
  expect(teamView(state, index).functions.find((fn) => fn.fn === 'engineering')!.recoveryNote).toContain('no delivery capacity')
})
it('keeps the displayed business commitment fixed when a decision records delay', () => {
  const state = newGame(index, { seed: 'fixed-business-date' })
  state.currentDay = 60
  for (const node of Object.values(state.organisation.nodes)) node.discovered = true
  for (const edge of Object.values(state.organisation.edges)) edge.discovered = true
  const before = collisions(state, index).find((collision) => collision.objectiveId === 'obj-platform-launch')!
  expect(before).toBeDefined()
  state.business.objectives['obj-platform-launch']!.delayDays = 45
  const after = collisions(state, index).find((collision) => collision.objectiveId === 'obj-platform-launch')!
  expect(after.daysUntilTarget).toBe(before.daysUntilTarget)
  expect(after.recordedDelayDays).toBe(45)
})
it('makes actual launch choices change objective outcomes under matched programme friction', () => {
  const outcomes = ['opt-launch-support', 'opt-launch-oppose'].map((optionId) => {
    const state = newGame(index, { seed: 'objective-component', difficulty: 'ciso', situation: 'sit-after-breach' })
    for (let day = 2; day <= 364; day += 1) {
      state.currentDay = day
      for (const id of ['prog-identity', 'prog-ransomware']) state.programmes.programmes[id]!.status = day <= index.programme.get(id)!.durationDays ? 'active' : 'complete'
      if (day === 22) {
        const decision = openDecision(state, index, 'dec-launch-conditions')!
        const rationaleTagIds = index.decision.get(decision.defId)!.rationaleTagIds?.slice(0, 1) ?? [index.content.rationaleTags[0]!.id]
        expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId, rationaleTagIds }).ok).toBe(true)
      }
      tickObjectives(state, index)
    }
    return state.business.objectives['obj-platform-launch']!.status
  })
  expect(outcomes).toEqual(['achieved', 'failed'])
})
