import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { checkInvariants } from '@/game/engine/invariants'
import { testIndex } from './helpers'

describe('invariants', () => {
  it('holds across a full campaign', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inv-1' })
    for (let i = 0; i < 13; i += 1) {
      runDays(state, index, 28)
      expect(checkInvariants(state, index)).toEqual([])
    }
  })

  it('detects an out-of-range control value', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inv-2' })
    state.controls.controls['ctl-mfa']!.coverage = 1.4
    expect(checkInvariants(state, index).map((v) => v.rule)).toContain('control-unit-range')
  })

  it('detects a discovered node that does not exist in this world', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inv-3' })
    const node = Object.values(state.organisation.nodes)[0]!
    node.exists = false
    node.discovered = true
    expect(checkInvariants(state, index).map((v) => v.rule)).toContain('undiscoverable-node-shown')
  })

  it('detects a resolved decision left on the open list', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inv-4' })
    runDays(state, index, 2)
    const decisionId = state.decisions.openIds[0]!
    state.decisions.decisions[decisionId]!.resolvedDay = 1
    expect(checkInvariants(state, index).map((v) => v.rule)).toContain('resolved-decision-not-open')
  })

  it('detects a NaN budget', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inv-5' })
    state.resources.budgetRemaining = Number.NaN
    expect(checkInvariants(state, index).map((v) => v.rule)).toContain('budget-finite')
  })

  it('keeps every invalidated assumption traceable', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inv-6' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-legacy-outage' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: ['rat-retirement'],
      assumptionDefIds: ['asm-retirement'],
      days: 120,
    })
    state.flags['legacy.retirementDay'] = 360
    runDays(state, index, 2)
    const invalidated = Object.values(state.assumptions.assumptions).filter((a) => a.status === 'invalidated')
    expect(invalidated.length).toBeGreaterThan(0)
    for (const assumption of invalidated) {
      expect(assumption.invalidatedDay).toBeDefined()
      expect(assumption.invalidationReason).toBeTruthy()
    }
    expect(checkInvariants(state, index)).toEqual([])
  })
})
