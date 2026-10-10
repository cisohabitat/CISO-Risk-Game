import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

/**
 * A meeting says what was said. Three AI playtesters asked what an executive
 * had actually told them, because every meeting returned one stock line per
 * approach and kept it only as a toast.
 */
describe('executive meetings', () => {
  it("talks through the person's own plan, naming only systems the player has found", () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'meetings' })
    runDays(state, index, 5)
    expect(state.organisation.nodes['node-acq-kestrel']?.discovered).toBe(false)
    const result = applyAction(state, index, { type: 'meetStakeholder', stakeholderId: 'stk-cfo', approach: 'listen' })
    expect(result.ok).toBe(true)
    expect(result.message).toContain('the plan to complete and integrate the Kestrel acquisition, due 3 September')
    expect(result.message).toContain('It rests on Corporate Network.')
    expect(result.message).not.toContain('Kestrel Digital (acquisition)')
  })

  it('names the worst risk the player holds that reaches that plan', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'meetings' })
    runDays(state, index, 5)
    // An empty register, so the only risk that can be named is the one raised below.
    state.risks.scenarios = {}
    const before = applyAction(state, index, { type: 'meetStakeholder', stakeholderId: 'stk-digital', approach: 'brief' })
    expect(before.message).toContain('None on your register does yet')
    expect(applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-platform-tampering' }).ok).toBe(true)
    state.resources.focusRemaining = 5
    const after = applyAction(state, index, { type: 'meetStakeholder', stakeholderId: 'stk-digital', approach: 'brief' })
    expect(after.message).toContain(`You can answer it: ${index.riskScenario.get('risk-platform-tampering')!.title}.`)
  })

  it('keeps what was said in the inbox, already read, and on the card', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'meetings' })
    runDays(state, index, 5)
    const result = applyAction(state, index, { type: 'meetStakeholder', stakeholderId: 'stk-coo', approach: 'listen' })
    expect(result.message).toContain('Top of the list:')
    const note = state.inbox.messages[0]!
    expect(note.subject).toBe('Your meeting with Helen Brandt')
    expect(note.body).toBe(result.message)
    expect(note.read).toBe(true)
    expect(state.stakeholders.stakeholders['stk-coo']!.memory.at(-1)?.summary).toMatch(/^You asked about /)
  })
})

describe('what is on the register', () => {
  it('counts inherited risks not yet assessed, and the services a risk would hit', () => {
    // Tomas said "Nothing on your register reaches it" of Kestrel beside an
    // inherited acquisition risk he owned (AI tablet playtest).
    const index = testIndex()
    const state = newGame(index, { seed: 'meetings-register' })
    runDays(state, index, 5)
    const kestrel = state.risks.scenarios['risk-acquisition-integration']
    if (kestrel) kestrel.status = 'emerging'
    else {
      const def = index.riskScenario.get('risk-acquisition-integration')!
      state.risks.scenarios[def.id] = { ...Object.values(state.risks.scenarios)[0]!, id: def.id, status: 'emerging' }
    }
    const result = applyAction(state, index, { type: 'meetStakeholder', stakeholderId: 'stk-cfo', approach: 'listen' })
    expect(result.message).toContain(index.riskScenario.get('risk-acquisition-integration')!.title)
  })
})
