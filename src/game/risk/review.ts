/**
 * Keeps risk scenario assessments current and surfaces reviews that are due.
 * Assessment is derived, never authored: the bands follow world state.
 */
import type { ContentIndex, GameState } from '../types'
import { assessScenario } from './calculations'
import { confidenceFromUncertainty, MATERIAL_MOVE } from './bands'

export interface RiskReviewResult {
  dueForReview: string[]
  materiallyWorse: { scenarioId: string; previous: number; current: number }[]
  /** Acceptances whose period ran out today. The tick turns each into a decision. */
  expiredAcceptances: string[]
}

export function refreshScenarioAssessments(state: GameState, index: ContentIndex): RiskReviewResult {
  const result: RiskReviewResult = { dueForReview: [], materiallyWorse: [], expiredAcceptances: [] }

  for (const scenario of Object.values(state.risks.scenarios)) {
    const def = index.riskScenario.get(scenario.id)
    if (!def) continue
    const assessment = assessScenario(state, index, def)
    const previous = scenario.lastAssessed?.residual
    scenario.lastAssessed = {
      day: state.currentDay,
      exposure: assessment.exposure,
      consequence: assessment.consequence,
      residual: assessment.residual,
    }
    scenario.firstAssessed ??= { day: state.currentDay, residual: assessment.residual }
    scenario.confidence = confidenceFromUncertainty(assessment.uncertainty)

    if (previous !== undefined && assessment.residual - previous > MATERIAL_MOVE) {
      result.materiallyWorse.push({ scenarioId: scenario.id, previous, current: assessment.residual })
      scenario.nextReviewDay = Math.min(scenario.nextReviewDay, state.currentDay + 7)
    }
    if (scenario.status === 'accepted' && scenario.acceptedUntilDay !== undefined) {
      if (state.currentDay >= scenario.acceptedUntilDay) {
        // It used to flip back to open in silence. An acceptance was a
        // decision the player made on stated assumptions; its running out is
        // one they should make again, not one that happens to them.
        scenario.status = 'open'
        scenario.acceptedUntilDay = undefined
        scenario.nextReviewDay = state.currentDay
        result.expiredAcceptances.push(scenario.id)
      }
    }
    if (state.currentDay >= scenario.nextReviewDay && scenario.status !== 'closed') {
      result.dueForReview.push(scenario.id)
    }
  }
  return result
}

/** Hypothesis confidence follows the balance of evidence attached to it. */
export function refreshHypothesisConfidence(state: GameState): void {
  for (const hypothesis of Object.values(state.risks.hypotheses)) {
    if (hypothesis.status === 'rejected' || hypothesis.status === 'converted') continue
    const support = hypothesis.supportingEvidenceIds.length
    const against = hypothesis.contradictingEvidenceIds.length
    const net = support - against
    hypothesis.confidence = net >= 3 ? 'high' : net >= 1 ? 'medium' : 'low'
  }
}
