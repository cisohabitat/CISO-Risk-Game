import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { tickAssumptions, VALIDATION_RULES } from '@/game/assumptions/validation'
import { testIndex } from './helpers'

describe('assumption system', () => {
  it('has a rule for every authored assumption', () => {
    const index = testIndex()
    for (const assumption of index.content.assumptions) {
      expect(VALIDATION_RULES[assumption.validationRuleId], assumption.id).toBeTypeOf('function')
    }
  })

  it('invalidates an assumption deterministically when the world contradicts it', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'assume-1' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-legacy-outage' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: ['rat-retirement'],
      assumptionDefIds: ['asm-retirement'],
      days: 200,
    })
    const assumptionId = state.risks.scenarios['risk-legacy-outage']!.assumptionIds[0]!
    expect(state.assumptions.assumptions[assumptionId]!.status).toBe('valid')

    // The migration slips past the end of Q3: the assumption no longer holds.
    state.flags['legacy.retirementDay'] = 320
    const result = tickAssumptions(state, index)
    expect(result.invalidated.map((i) => i.assumptionId)).toContain(assumptionId)
    const assumption = state.assumptions.assumptions[assumptionId]!
    expect(assumption.status).toBe('invalidated')
    expect(assumption.invalidatedDay).toBe(state.currentDay)
    expect(assumption.invalidationReason).toBeTruthy()
  })

  it('brings forward the review of every risk that leaned on the assumption', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'assume-2' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-legacy-outage' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: ['rat-retirement'],
      assumptionDefIds: ['asm-retirement'],
      days: 200,
    })
    const scenario = state.risks.scenarios['risk-legacy-outage']!
    scenario.nextReviewDay = 300
    state.flags['legacy.retirementDay'] = 320
    tickAssumptions(state, index)
    expect(scenario.nextReviewDay).toBe(state.currentDay)
  })

  it('pauses the clock and writes to the inbox when an assumption fails', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'assume-3' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-supplier-ransomware',
      rationaleTagIds: ['rat-compensating'],
      assumptionDefIds: ['asm-supplier-no-priv'],
      days: 180,
    })
    // Discovering the provider's standing access contradicts the assumption.
    const edge = state.organisation.edges['edge-msp-admins-identity']!
    edge.exists = true
    edge.discovered = true
    const ticks = runDays(state, index, 1)
    expect(ticks[0]?.pauseReasons).toContain('assumption-invalidated')
    expect(state.inbox.messages.some((m) => m.type === 'assumption')).toBe(true)
  })

  it('is stable: an assumption that holds is never invalidated', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'assume-4' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-legacy-outage' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: ['rat-retirement'],
      assumptionDefIds: ['asm-retirement'],
      days: 200,
    })
    state.flags['legacy.retirementDay'] = 200
    for (let i = 0; i < 20; i += 1) {
      const result = tickAssumptions(state, index)
      expect(result.invalidated).toHaveLength(0)
    }
  })
})
