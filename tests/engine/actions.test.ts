import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

function gameOn(seed: string): { state: GameState; index: ReturnType<typeof testIndex> } {
  const index = testIndex()
  const state = newGame(index, { seed })
  return { state, index }
}

describe('player actions', () => {
  it('refuses to spend attention it does not have, and says why', () => {
    const { state, index } = gameOn('act-1')
    state.resources.focusRemaining = 0
    const result = applyAction(state, index, {
      type: 'startInvestigation',
      investigationId: 'inv-access-review',
      leaderId: 'lead-grc',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/attention/i)
  })

  it('refuses work the team has no capacity for', () => {
    const { state, index } = gameOn('act-2')
    for (const fn of Object.values(state.team.functions)) fn.committed = fn.capacity
    const result = applyAction(state, index, {
      type: 'startInvestigation',
      investigationId: 'inv-access-review',
      leaderId: 'lead-grc',
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/capacity/i)
  })

  it('commissions an investigation that consumes capacity and returns evidence', () => {
    const { state, index } = gameOn('act-3')
    const before = state.team.functions['iam']!.committed
    const result = applyAction(state, index, {
      type: 'startInvestigation',
      investigationId: 'inv-access-review',
      leaderId: 'lead-eng',
    })
    expect(result.ok).toBe(true)
    // Committed capacity is derived, and must be accurate immediately so a
    // second commission the same day is checked against the first.
    expect(state.team.functions['iam']!.committed).toBeGreaterThan(before)
    runDays(state, index, 60)
    expect(state.evidence.order).toContain('ev-priv-recert-overdue')
    const assignment = state.team.assignments[0]!
    expect(assignment.status).toBe('complete')
    // Capacity is released when the work finishes.
    expect(state.team.functions['iam']!.committed).toBeLessThanOrEqual(before + 0.001)
  })

  it('will not commission the same one-off investigation twice', () => {
    const { state, index } = gameOn('act-4')
    applyAction(state, index, { type: 'startInvestigation', investigationId: 'inv-team-review', leaderId: 'lead-grc' })
    const second = applyAction(state, index, {
      type: 'startInvestigation',
      investigationId: 'inv-team-review',
      leaderId: 'lead-grc',
    })
    expect(second.ok).toBe(false)
  })

  it('requires supporting evidence before a hypothesis becomes a risk scenario', () => {
    const { state, index } = gameOn('act-5')
    applyAction(state, index, { type: 'createHypothesis', templateId: 'hyp-supplier-privilege', evidenceIds: [] })
    const hypothesisId = Object.keys(state.risks.hypotheses)[0]!
    const rejected = applyAction(state, index, { type: 'convertHypothesis', hypothesisId })
    expect(rejected.ok).toBe(false)

    state.evidence.items['ev-msp-standing-access'] = {
      id: 'ev-msp-standing-access',
      discoveredDay: 0,
      sourceLabel: 'test',
      read: true,
      archived: false,
      linkedHypothesisIds: [],
    }
    state.evidence.order.push('ev-msp-standing-access')
    applyAction(state, index, {
      type: 'attachEvidence',
      hypothesisId,
      evidenceId: 'ev-msp-standing-access',
      stance: 'supporting',
    })
    state.resources.focusRemaining = 5
    const converted = applyAction(state, index, { type: 'convertHypothesis', hypothesisId })
    expect(converted.ok).toBe(true)
    expect(state.risks.scenarios['risk-supplier-ransomware']?.status).toBe('open')
  })

  it('requires a recorded rationale to accept a risk', () => {
    const { state, index } = gameOn('act-6')
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-legacy-outage' })
    const noRationale = applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: [],
      assumptionDefIds: [],
      days: 90,
    })
    expect(noRationale.ok).toBe(false)

    const accepted = applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: ['rat-retirement'],
      assumptionDefIds: ['asm-retirement'],
      days: 90,
    })
    expect(accepted.ok).toBe(true)
    const scenario = state.risks.scenarios['risk-legacy-outage']!
    expect(scenario.status).toBe('accepted')
    expect(scenario.assumptionIds).toHaveLength(1)
    const assumption = state.assumptions.assumptions[scenario.assumptionIds[0]!]!
    expect(assumption.defId).toBe('asm-retirement')
  })

  it('reopens an accepted risk when the acceptance period expires', () => {
    const { state, index } = gameOn('act-7')
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-legacy-outage' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: ['rat-within-tolerance'],
      assumptionDefIds: [],
      days: 40,
    })
    runDays(state, index, 45)
    expect(state.risks.scenarios['risk-legacy-outage']!.status).toBe('open')
  })

  it('starts a programme only with funding, and spends it', () => {
    const { state, index } = gameOn('act-8')
    const def = index.programme.get('prog-identity')!
    const noMoney = applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 0 })
    expect(noMoney.ok).toBe(false)

    const budgetBefore = state.resources.budgetRemaining
    const started = applyAction(state, index, {
      type: 'startProgramme',
      programmeId: 'prog-identity',
      budget: def.budgetCost,
    })
    expect(started.ok).toBe(true)
    expect(state.resources.budgetRemaining).toBe(budgetBefore - def.budgetCost)
    expect(state.programmes.programmes['prog-identity']!.status).toBe('active')
  })

  it('improves controls through programme milestones rather than instantly', () => {
    const { state, index } = gameOn('act-9')
    const def = index.programme.get('prog-identity')!
    const coverageBefore = state.controls.controls['ctl-mfa']!.coverage
    applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: def.budgetCost })
    runDays(state, index, 5)
    expect(state.controls.controls['ctl-mfa']!.coverage).toBeCloseTo(coverageBefore, 1)
    runDays(state, index, 180)
    expect(state.controls.controls['ctl-mfa']!.coverage).toBeGreaterThan(coverageBefore)
  })

  it('makes pressing an unreceptive executive cost trust', () => {
    const { state, index } = gameOn('act-10')
    const person = state.stakeholders.stakeholders['stk-cio']!
    person.trust = 0.3
    const before = person.trust
    const result = applyAction(state, index, { type: 'meetStakeholder', stakeholderId: 'stk-cio', approach: 'press' })
    expect(result.ok).toBe(true)
    expect(person.trust).toBeLessThan(before)
    expect(person.memory.length).toBeGreaterThan(0)
  })

  it('rewards escalation that is backed by evidence more than escalation that is not', () => {
    const { state, index } = gameOn('act-11')
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-identity-concentration' })
    const scenario = state.risks.scenarios['risk-identity-concentration']!
    scenario.confidence = 'limited'
    const trustBefore = state.stakeholders.stakeholders['stk-cio']!.trust
    applyAction(state, index, { type: 'escalateRisk', scenarioId: scenario.id, stakeholderId: 'stk-cio' })
    const afterWeak = state.stakeholders.stakeholders['stk-cio']!.trust
    expect(afterWeak).toBeLessThan(trustBefore)

    scenario.confidence = 'strong'
    state.resources.focusRemaining = 5
    applyAction(state, index, { type: 'escalateRisk', scenarioId: scenario.id, stakeholderId: 'stk-cio' })
    expect(state.stakeholders.stakeholders['stk-cio']!.trust).toBeGreaterThan(afterWeak)
  })

  it('records a decision with its rationale and applies delayed consequences later', () => {
    const { state, index } = gameOn('act-12')
    runDays(state, index, 2)
    const decisionId = state.decisions.openIds.find((id) => {
      const decision = state.decisions.decisions[id]
      return decision?.defId === 'dec-ceo-three-risks'
    })
    if (!decisionId) return
    const result = applyAction(state, index, {
      type: 'resolveDecision',
      decisionId,
      optionId: 'opt-ceo-confident',
      rationaleTagIds: ['rat-material'],
    })
    expect(result.ok).toBe(true)
    expect(state.history.decisionsLog.some((entry) => entry.decisionId === decisionId)).toBe(true)
    expect(state.pendingEffects.length).toBeGreaterThan(0)
    const trustBefore = state.stakeholders.stakeholders['stk-ceo']!.trust
    runDays(state, index, 50)
    expect(state.stakeholders.stakeholders['stk-ceo']!.trust).toBeLessThan(trustBefore)
  })

  it('cannot resolve the same decision twice', () => {
    const { state, index } = gameOn('act-13')
    runDays(state, index, 1)
    const decisionId = state.decisions.openIds[0]!
    const decision = state.decisions.decisions[decisionId]!
    const def = index.decision.get(decision.defId)!
    applyAction(state, index, {
      type: 'resolveDecision',
      decisionId,
      optionId: def.options[0]!.id,
      rationaleTagIds: ['rat-material'],
    })
    const second = applyAction(state, index, {
      type: 'resolveDecision',
      decisionId,
      optionId: def.options[0]!.id,
      rationaleTagIds: ['rat-material'],
    })
    expect(second.ok).toBe(false)
  })
})
