import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { openDecisions } from '@/store/selectors'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { functionStrain, mostPressedFunction, refreshCommittedCapacity } from '@/game/team/capacity'
import { renderDecisionText } from '@/game/decisions/describe'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * The overload decision has to act on the function that is overloaded.
 *
 * Found by playing a year by hand: one enquiry and one programme, both landing
 * on identity, took identity to breaking point in fifteen days. The decision
 * that fired said the SOC lead was raising it, "Stop something" stopped
 * nothing, and "Buy capacity" bought SOC capacity — while the SOC was idle.
 * Strain reads from the most pressed function; everything that reacts to it
 * has to as well.
 */
function loadIdentity(seed: string): GameState {
  const index = testIndex()
  const state = newGame(index, { seed })
  runDays(state, index, 5)
  // Two pieces of work that both draw on identity.
  const leader = index.content.leaders.find((l) => l.functions.includes('iam'))!
  const started = applyAction(state, index, { type: 'startInvestigation', investigationId: 'inv-access-review', leaderId: leader.id })
  expect(started.ok, started.message).toBe(true)
  const programme = index.programme.get('prog-identity')!
  const built = applyAction(state, index, { type: 'startProgramme', programmeId: programme.id, budget: programme.budgetCost })
  expect(built.ok, built.message).toBe(true)
  runDays(state, index, 1)
  return state
}

describe('overload acts on the function that is overloaded', () => {
  it('names identity as the most pressed function when identity carries the load', () => {
    const state = loadIdentity('ovl-1')
    expect(mostPressedFunction(state)).toBe('iam')
    expect(functionStrain(state, 'iam')).toBeGreaterThan(functionStrain(state, 'soc'))
  })

  it('"stop something" stops something, on that function', () => {
    const index = testIndex()
    const state = loadIdentity('ovl-2')
    const before = functionStrain(state, 'iam')
    const committedBefore = state.team.functions.iam!.committed
    const running = state.team.assignments.filter((a) => a.status === 'running')
    expect(running.length).toBeGreaterThan(0)

    applyEffects(state, [{ type: 'work.stop', fn: 'most-pressed' }], { index, rng: createRng(state.seed, 0), source: 'test' })

    const abandoned = state.team.assignments.filter((a) => a.status === 'abandoned')
    expect(abandoned).toHaveLength(1)
    expect(abandoned[0]!.capacityPerDay.iam ?? 0).toBeGreaterThan(0)
    // Strain reads at most 1, and identity starts two short, so a function
    // this far over can still read 1 after one piece of work comes off it;
    // what must fall is the work it is carrying.
    expect(state.team.functions.iam!.committed).toBeLessThan(committedBefore)
    expect(functionStrain(state, 'iam')).toBeLessThanOrEqual(before)
    // And the player is told, by the leader who owns that function.
    const notice = state.inbox.messages.find((m) => m.subject.startsWith('Pulled back:'))
    expect(notice).toBeDefined()
    expect(notice!.body).toContain('identity')
  })

  it('"buy capacity" buys it where the load is, not at the SOC', () => {
    const index = testIndex()
    const state = loadIdentity('ovl-3')
    const iamBefore = state.team.functions.iam!.capacity
    const socBefore = state.team.functions.soc!.capacity

    applyEffects(state, [{ type: 'capacity.change', fn: 'most-pressed', delta: 1.5 }], { index, rng: createRng(state.seed, 0), source: 'test' })

    expect(state.team.functions.iam!.capacity).toBeCloseTo(iamBefore + 1.5, 5)
    expect(state.team.functions.soc!.capacity).toBe(socBefore)
  })

  it('says which function in the decision text, never a raw placeholder', () => {
    const index = testIndex()
    const state = loadIdentity('ovl-4')
    const def = index.decision.get('dec-team-overload')!
    const description = renderDecisionText(def.description, state, index)
    expect(description).not.toContain('{{')
    expect(description).toContain('identity')
    expect(description).not.toMatch(/SOC lead/)

    // And through the selector the interface reads, not only the helper.
    openDecision(state, index, 'dec-team-overload')
    const view = openDecisions(state, index).find((d) => d.defId === 'dec-team-overload')!
    expect(view.description).not.toContain('{{')
    expect(view.description).toContain('identity')
    expect(view.context).not.toContain('{{')
  })

  it('has no effect in the overload decision aimed at the SOC by name', () => {
    // Guards the regression this fixes: strain is computed from the most
    // pressed function, so nothing that reacts to it may assume which one.
    const index = testIndex()
    const def = index.decision.get('dec-team-overload')!
    for (const option of def.options) {
      const json = JSON.stringify(option.immediateEffects)
      expect(json, `${option.id} targets the SOC by name`).not.toMatch(/"(fn|leaderId)":"(soc|lead-soc)"/)
    }
  })

  it('pauses the programme loading the function when no enquiry does', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'ovl-6' })
    runDays(state, index, 5)
    const programme = index.programme.get('prog-identity')!
    const built = applyAction(state, index, { type: 'startProgramme', programmeId: programme.id, budget: programme.budgetCost })
    expect(built.ok, built.message).toBe(true)
    runDays(state, index, 3)
    expect(state.team.assignments.filter((a) => a.status === 'running')).toHaveLength(0)
    const before = functionStrain(state, 'iam')

    applyEffects(state, [{ type: 'work.stop', fn: 'iam' }], { index, rng: createRng(state.seed, 0), source: 'test' })

    expect(state.programmes.programmes['prog-identity']!.status).toBe('paused')
    expect(functionStrain(state, 'iam')).toBeLessThan(before)
    const message = state.inbox.messages.find((m) => m.subject.startsWith('Paused:'))
    expect(message?.body).toContain('resume')
    // The player can take it back: the same action the Programmes screen dispatches.
    const resumed = applyAction(state, index, { type: 'setProgrammeStatus', programmeId: 'prog-identity', status: 'active' })
    expect(resumed.ok).toBe(true)
  })

  it('leaves committed capacity consistent after stopping work', () => {
    const index = testIndex()
    const state = loadIdentity('ovl-5')
    applyEffects(state, [{ type: 'work.stop' }], { index, rng: createRng(state.seed, 0), source: 'test' })
    const committedNow = state.team.functions.iam!.committed
    refreshCommittedCapacity(state, index)
    expect(state.team.functions.iam!.committed).toBeCloseTo(committedNow, 5)
  })
})
