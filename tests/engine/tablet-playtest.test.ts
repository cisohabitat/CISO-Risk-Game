import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { outlookBecause } from '@/game/team/capacity'
import { tickProgrammes } from '@/game/programmes/progression'
import { createRng } from '@/game/engine/rng'
import { testIndex } from './helpers'

/**
 * What the AI tablet playtest found in a first year after the breach
 * (docs/playtests/2026-10-10-ai-tablet-after-breach.md), held.
 */
const index = testIndex()

describe('the tablet first year', () => {
  it('lands a push-through’s resignation on the team that was pushed', () => {
    const state = newGame(index, { seed: 'tablet-pushed' })
    runDays(state, index, 3)
    // Engineering is the team closest to breaking when the decision is taken.
    for (const fn of Object.values(state.team.functions)) fn.committed = 0
    state.team.functions.engineering!.committed = state.team.functions.engineering!.capacity * 1.5
    const def = index.decision.get('dec-team-overload')!
    const option = def.options.find((o) => (o.delayedEffects ?? []).some((d) => d.effects.some((e) => e.type === 'team.departure')))!
    const runtime = openDecision(state, index, def.id)!
    const taken = applyAction(state, index, {
      type: 'resolveDecision', decisionId: runtime.id, optionId: option.id, rationaleTagIds: def.rationaleTagIds?.slice(0, 1) ?? [],
    })
    expect(taken.ok, taken.message).toBe(true)
    const pending = state.pendingEffects.find((p) => p.effects.some((e) => e.type === 'team.departure'))!
    expect(pending.effects.find((e) => e.type === 'team.departure')).toMatchObject({ fn: 'engineering' })
  })

  it('clears a programme’s blockers when it is delivered', () => {
    const state = newGame(index, { seed: 'tablet-delivered' })
    const def = index.programme.get('prog-ransomware')!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)
    const programme = state.programmes.programmes[def.id]!
    programme.blockers.push({ id: def.blockers[0]!.id, startedDay: 1, resolved: false })
    programme.progress = 0.9999
    tickProgrammes(state, index, createRng(state.seed, 3))
    expect(programme.status).toBe('complete')
    expect(programme.blockers.every((b) => b.resolved)).toBe(true)
  })

  it('lets an assumption under review be reaffirmed, at a cost of attention', () => {
    const state = newGame(index, { seed: 'tablet-reaffirm' })
    runDays(state, index, 3)
    const scenarioId = Object.keys(state.risks.scenarios)[0]!
    expect(applyAction(state, index, {
      type: 'acceptRisk', scenarioId, rationaleTagIds: ['rat-within-tolerance'], days: 90, assumptionDefIds: ['asm-mfa-admins'],
    }).ok).toBe(true)
    const assumption = Object.values(state.assumptions.assumptions)[0]!
    assumption.status = 'uncertain'
    const before = state.resources.focusRemaining
    const result = applyAction(state, index, { type: 'reaffirmAssumption', assumptionId: assumption.id })
    expect(result.ok, result.message).toBe(true)
    expect(assumption.status).toBe('valid')
    expect(assumption.nextReviewDay).toBe(state.currentDay + 60)
    expect(state.resources.focusRemaining).toBe(before - 1)
  })

  it('says why the commission dialog expects thin work, rather than blaming a lead who has room', () => {
    const state = newGame(index, { seed: 'tablet-outlook' })
    const leader = { ...Object.values(state.team.leaders)[0]!, workload: 0.2, morale: 0.7 }
    expect(outlookBecause(leader, 0.95)).toBe('The team as a whole is stretched')
    expect(outlookBecause({ ...leader, workload: 0.7 }, 0.95)).toBe('Too much else on')
  })
})
