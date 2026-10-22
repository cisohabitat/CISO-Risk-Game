import { describe, expect, it } from 'vitest'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { tickEvents } from '@/game/events/engine'
import { createRng } from '@/game/engine/rng'
import { tickProgrammes } from '@/game/programmes/progression'
import { buildAnnualReview } from '@/game/debrief/review'
import { testIndex } from './helpers'

const index = testIndex()
describe('programme funding and delivery balance', () => {
  it('admits half funding, rejects token allocations and leaves failed purchases untouched', () => {
    const state = newGame(index, { seed: 'balance-funding' })
    state.resources.budgetRemaining = 600
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 1 }).ok).toBe(false)
    state.resources.focusRemaining = 0
    const before = structuredClone(state)
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 425 }).ok).toBe(false)
    expect(state).toEqual(before)
    state.resources.focusRemaining = 5
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 425 }).ok).toBe(true)
    expect(state.resources.budgetRemaining).toBe(175)
  })
  it('cannot start unfunded work through resume', () => {
    const state = newGame(index, { seed: 'balance-resume' })
    const before = structuredClone(state)
    expect(applyAction(state, index, { type: 'setProgrammeStatus', programmeId: 'prog-identity', status: 'active' }).ok).toBe(false)
    expect(state).toEqual(before)
  })
  it.each([0, -100, 1, Number.NaN, Number.POSITIVE_INFINITY])('rejects an unpriced acceleration (%s)', (budget) => {
    const state = newGame(index, { seed: 'balance-push' })
    applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 850 })
    const before = structuredClone(state)
    expect(applyAction(state, index, { type: 'accelerateProgramme', programmeId: 'prog-identity', budget }).ok).toBe(false)
    expect(state).toEqual(before)
  })
  it('does not charge a blocker resolution or acceleration refused for attention', () => {
    const state = newGame(index, { seed: 'balance-atomic' })
    applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-thirdparty', budget: 520 })
    state.programmes.programmes['prog-thirdparty']!.blockers.push({ id: 'blk-3p-contract', resolved: false, startedDay: 0 })
    state.resources.focusRemaining = 0
    const before = structuredClone(state)
    expect(applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: 'prog-thirdparty', blockerId: 'blk-3p-contract' }).ok).toBe(false)
    expect(state).toEqual(before)
    expect(applyAction(state, index, { type: 'accelerateProgramme', programmeId: 'prog-thirdparty', budget: 130 }).ok).toBe(false)
    expect(state).toEqual(before)
  })
  it('records partial funding spend against the allocated amount', () => {
    const state = newGame(index, { seed: 'balance-spend' })
    applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 425 })
    const programme = state.programmes.programmes['prog-identity']!
    for (let day = 0; day < 200; day += 1) tickProgrammes(state, index, createRng(`spend-${day}`))
    expect(programme.progress).toBeGreaterThan(0)
    expect(programme.budgetSpent).toBeCloseTo(425 * programme.progress, 0)
    expect(programme.budgetSpent).toBeLessThanOrEqual(programme.budgetAllocated)
  })
  it('credits delivered work rather than a flat bonus for simply starting', () => {
    const state = newGame(index, { seed: 'balance-assessment' })
    const programme = state.programmes.programmes['prog-identity']!
    programme.status = 'active'; programme.startedDay = 0
    const assess = () => buildAnnualReview(state, index).dimensions.find((d) => d.id === 'programme-execution')!
    programme.progress = 0
    expect(assess().band).toBe('weak')
    programme.progress = 0.65
    expect(assess().band).toBe('solid')
    expect(assess().narrative).toContain('delivered progress')
  })
})


it('charges the quoted acceleration and records additional funding', () => {
  const state = newGame(index, { seed: 'balance-funded-push' })
  applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-thirdparty', budget: 520 })
  const budget = state.resources.budgetRemaining
  expect(applyAction(state, index, { type: 'accelerateProgramme', programmeId: 'prog-thirdparty', budget: 130 }).ok).toBe(true)
  expect(state.resources.budgetRemaining).toBe(budget - 130)
  expect(state.programmes.programmes['prog-thirdparty']!.budgetAllocated).toBe(650)
  expect(state.programmes.programmes['prog-thirdparty']!.accelerated).toBe(true)
})

it.each([['prog-identity', 'evt-q4-identity-enforce'], ['prog-ransomware', 'evt-q4-recovery-window']])('offers earned follow-through in Q3 for %s, without offering unfinished capability', (programmeId, eventId) => {
  const state = newGame(index, { seed: 'balance-follow-through' })
  const programme = state.programmes.programmes[programmeId!]!
  programme.status = 'active'; programme.progress = 0.8
  state.currentDay = 209
  expect(tickEvents(state, index, createRng('before')).fired.map((f) => f.def.id)).not.toContain(eventId)
  state.currentDay = 210; programme.progress = 0.79
  expect(tickEvents(state, index, createRng('unfinished')).fired.map((f) => f.def.id)).not.toContain(eventId)
  programme.progress = 0.8
  expect(tickEvents(state, index, createRng('ready')).fired.map((f) => f.def.id)).toContain(eventId)
})
