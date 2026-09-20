import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { buildAnnualReview } from '@/game/debrief/review'
import { effortAllocation } from '@/game/debrief/prioritisation'
import { openDecision } from '@/game/decisions/open'
import { testIndex } from './helpers'

/**
 * Three flat contradictions from the second observed playtest
 * (docs/playtests/2026-09-21-ai-browser-repeat.md): the review told a
 * player who stood up incident command that it was never stood up, told one
 * who took a production restore that recovery was never exercised, and told
 * one who funded recovery on day one that nothing went near the recovery risk.
 */
describe('the review against the visible decision record', () => {
  it('credits incident command that the player stood up', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt2-command' })
    runDays(state, index, 20)
    const family = index.content.incidentFamilies[0]!
    applyEffects(state, [{ type: 'incident.start', familyId: family.id }], { index, rng: createRng(state.seed, 3), source: 'test' })
    runDays(state, index, 1)
    const runtime = openDecision(state, index, 'dec-inc-command')!
    const taken = applyAction(state, index, { type: 'resolveDecision', decisionId: runtime.id, optionId: 'opt-inc-command-yes', rationaleTagIds: ['rat-material'] })
    expect(taken.ok, taken.message).toBe(true)
    const incident = Object.values(state.incidents.incidents)[0]!
    expect(incident.commandActivated).toBe(true)
    runDays(state, index, 364 - state.currentDay)
    const text = buildAnnualReview(state, index).narrative.join(' ')
    expect(text).not.toContain('Incident command was never formally stood up')
  })

  it('counts a production restore as recovery exercised, in the evidence as well as the score', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt2-restore' })
    runDays(state, index, 10)
    state.flags['recovery.tested'] = true
    runDays(state, index, 364 - state.currentDay)
    const review = buildAnnualReview(state, index)
    const resilience = review.dimensions.find((d) => d.id === 'resilience')!
    expect(resilience.evidence.join(' ')).not.toContain('Recovery was never exercised')
    expect(resilience.evidence.join(' ')).toContain('production restore')
  })

  it('does not call a risk untouched when a programme that treats it was funded', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt2-recovery' })
    runDays(state, index, 3)
    // The session's shape: identity and recovery funded on day one. Identity
    // treats the pipeline and the identity platform; recovery treats supplier
    // ransomware, the legacy outage and recovery failure. Recovery failure was
    // reported missed because the programme was scored against the biggest
    // of its three and "missed" read only that one.
    for (const id of ['prog-identity', 'prog-ransomware']) {
      const def = index.programme.get(id)!
      const built = applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
      expect(built.ok, built.message).toBe(true)
    }
    runDays(state, index, 30)
    const effort = effortAllocation(state, index)
    const treated = new Set(['prog-identity', 'prog-ransomware'].flatMap((id) => index.content.riskScenarios.filter((s) => s.treatmentProgrammeIds.includes(id)).map((s) => s.id)))
    expect(treated.has('risk-recovery-failure')).toBe(true)
    expect(effort.missed && treated.has(effort.missed.id), `${effort.missed?.id} is treated by a funded programme and was called missed`).toBeFalsy()
  })
})
