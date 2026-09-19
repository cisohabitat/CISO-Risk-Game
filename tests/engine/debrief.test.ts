import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview, buildQuarterReview, materialTopics } from '@/game/debrief/review'
import { testIndex } from './helpers'

describe('reviews', () => {
  it('penalises a board pack that omits a material topic', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-1' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    runDays(state, index, 91)
    const scenario = state.risks.scenarios['risk-supplier-ransomware']!
    scenario.lastAssessed = { day: state.currentDay, exposure: 0.8, consequence: 0.8, residual: 0.8 }

    const topics = materialTopics(state, index)
    expect(topics.some((t) => t.material)).toBe(true)

    const omitted = buildQuarterReview(state, index, { quarter: 1, topics: [], recommendations: [], communicateUncertainty: false })
    expect(omitted.effects.some((e) => e.type === 'board.confidence' && e.delta < 0)).toBe(true)

    const covered = buildQuarterReview(state, index, {
      quarter: 1,
      topics: topics.filter((t) => t.material).map((t) => t.id),
      recommendations: [],
      communicateUncertainty: true,
    })
    expect(covered.effects.some((e) => e.type === 'board.confidence' && e.delta > 0)).toBe(true)
  })

  it('produces a multi-dimensional narrative review rather than a single score', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-2' })
    runDays(state, index, 364)
    const review = buildAnnualReview(state, index)
    expect(review.dimensions.length).toBeGreaterThanOrEqual(7)
    for (const dimension of review.dimensions) {
      expect(dimension.narrative.length).toBeGreaterThan(20)
      expect(['weak', 'developing', 'solid', 'strong']).toContain(dimension.band)
    }
    expect(review.narrative.length).toBeGreaterThan(1)
    expect(review.businessOutcome).toMatch(/objective/i)
  })

  it('references the decisions and rationale the player recorded', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-3' })
    for (let day = 0; day < 364; day += 1) {
      for (const decisionId of [...state.decisions.openIds]) {
        const decision = state.decisions.decisions[decisionId]
        const def = decision ? index.decision.get(decision.defId) : undefined
        if (!def) continue
        applyAction(state, index, {
          type: 'resolveDecision',
          decisionId,
          optionId: def.options[0]!.id,
          rationaleTagIds: ['rat-more-evidence'],
        })
      }
      runDays(state, index, 1)
    }
    const review = buildAnnualReview(state, index)
    const prioritisation = review.dimensions.find((d) => d.id === 'prioritisation')!
    expect(prioritisation.evidence.join(' ')).toMatch(/recorded rationale/)
    expect(state.history.decisionsLog.every((entry) => entry.rationaleTagIds.length > 0)).toBe(true)
  })

  it('names material blind spots left at the end of the year', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-4' })
    runDays(state, index, 364)
    const review = buildAnnualReview(state, index)
    expect(Array.isArray(review.blindSpots)).toBe(true)
    const understanding = state.organisation.understanding['overall'] ?? 0
    if (understanding < 0.6) expect(review.blindSpots.length).toBeGreaterThan(0)
  })
})
