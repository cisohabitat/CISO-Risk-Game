/**
 * Risks the board has not been shown: assessed, still live, and not a topic
 * of any quarterly paper the player has filed. Shared by the escalation that
 * says one exists and the text that names it, so the message cannot fire with
 * nothing to name.
 */
import type { GameState, RiskScenarioRuntime } from '../types'

export function unreportedScenarios(state: GameState): RiskScenarioRuntime[] {
  const reported = new Set(state.reviews.quarters.filter((review) => review.completed).flatMap((review) => review.topicsChosen))
  return Object.values(state.risks.scenarios)
    .filter((s) => s.status !== 'emerging' && s.status !== 'closed' && !reported.has(`risk:${s.id}`))
    .sort((a, b) => (b.lastAssessed?.residual ?? 0) - (a.lastAssessed?.residual ?? 0))
}
