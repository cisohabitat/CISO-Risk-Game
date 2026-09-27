import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { tickAssumptions, VALIDATION_RULES } from '@/game/assumptions/validation'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { buildAnnualReview } from '@/game/debrief/review'
import { testIndex } from './helpers'

describe('assumption system', () => {
  it('has a rule for every authored assumption', () => {
    const index = testIndex()
    for (const assumption of index.content.assumptions) {
      const rule = VALIDATION_RULES[assumption.validationRuleId]
      expect(rule, assumption.id).toBeDefined()
      expect(rule!.evaluate, assumption.id).toBeTypeOf('function')
      expect(rule!.revealedBy, assumption.id).toBeDefined()
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

describe('assumptions that were never true', () => {
  /**
   * The distinction the plan cares about: an assumption overtaken by events is
   * a lesson about change; one that was never true is a lesson about assurance,
   * and the player can only learn it by going and looking.
   */
  function recordFalseAssumption(seed: string) {
    const index = testIndex()
    const state = newGame(index, { seed })
    // MFA coverage starts well below the threshold this assumption asserts.
    expect(state.controls.controls['ctl-mfa']!.coverage).toBeLessThan(0.78)
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-identity-concentration' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-identity-concentration',
      rationaleTagIds: ['rat-compensating'],
      assumptionDefIds: ['asm-mfa-admins'],
      days: 180,
    })
    const assumption = Object.values(state.assumptions.assumptions).find((a) => a.defId === 'asm-mfa-admins')!
    return { index, state, assumption }
  }

  it('records that the assumption did not hold when it was made', () => {
    const { assumption } = recordFalseAssumption('never-true-1')
    expect(assumption.heldWhenRecorded).toBe(false)
    expect(assumption.status).toBe('valid')
  })

  it('does not invalidate the next day just because it was always false', () => {
    const { state, index, assumption } = recordFalseAssumption('never-true-2')
    runDays(state, index, 60)
    // Nothing has happened and nobody has looked, so nothing should be claimed.
    expect(assumption.status).not.toBe('invalidated')
  })

  it('surfaces it once the player assesses the control, and says it was never true', () => {
    const { state, index, assumption } = recordFalseAssumption('never-true-3')
    runDays(state, index, 20)
    expect(assumption.status).not.toBe('invalidated')

    // Assurance closes the gap between belief and truth.
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-identity-concentration' })
    applyEffects(state, [{ type: 'control.assess', controlId: 'ctl-mfa' }], {
      index,
      rng: createRng(state.seed, state.rngCursor),
      source: 'test',
    })
    runDays(state, index, 1)

    expect(assumption.status).toBe('invalidated')
    expect(assumption.invalidationReason).toMatch(/not true when you relied on it/i)
  })

  it('keeps the wording for an overtaken assumption free of that framing', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'overtaken' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-legacy-outage' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-legacy-outage',
      rationaleTagIds: ['rat-retirement'],
      assumptionDefIds: ['asm-retirement'],
      days: 200,
    })
    const assumption = Object.values(state.assumptions.assumptions).find((a) => a.defId === 'asm-retirement')!
    expect(assumption.heldWhenRecorded).toBe(true)

    state.flags['legacy.retirementDay'] = 320
    runDays(state, index, 1)
    expect(assumption.status).toBe('invalidated')
    expect(assumption.invalidationReason).not.toMatch(/never|not true when you relied/i)
  })

  it('names an untested false assumption as a blind spot in the annual review', () => {
    const { state, index, assumption } = recordFalseAssumption('never-true-4')
    runDays(state, index, 363)
    // Never assessed, so it never fired — and that is exactly the failure.
    expect(assumption.status).not.toBe('invalidated')
    const review = buildAnnualReview(state, index)
    expect(review.blindSpots.join(' ')).toMatch(/relied on .* and never tested it after that/i)
    // The authored statement is a sentence; quoted inside another it loses its full stop.
    for (const line of [...review.blindSpots, ...review.dimensions.flatMap((d) => d.evidence)]) {
      expect(line, line).not.toMatch(/\."/)
    }
  })

  it('stops the assumption mechanic firing as background noise', () => {
    // Recording every assumption at once used to invalidate most of them within
    // days. Only the ones the world actually overtakes should fire unprompted.
    const index = testIndex()
    const state = newGame(index, { seed: 'noise' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-supplier-ransomware',
      rationaleTagIds: ['rat-compensating'],
      assumptionDefIds: index.content.assumptions.map((a) => a.id),
      days: 200,
    })
    const recorded = Object.values(state.assumptions.assumptions).length
    expect(recorded).toBe(index.content.assumptions.length)

    runDays(state, index, 10)
    const firedEarly = Object.values(state.assumptions.assumptions).filter((a) => a.status === 'invalidated').length
    expect(firedEarly).toBeLessThanOrEqual(1)
  })
})
