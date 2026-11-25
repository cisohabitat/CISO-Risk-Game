/**
 * Risks the board has not been shown: assessed, still live, and not a topic
 * of any quarterly paper the player has filed. Shared by the escalation that
 * says one exists and the text that names it, so the message cannot fire with
 * nothing to name.
 */
import type { GameState, RiskScenarioRuntime } from '../types'
import { compareBands, consequenceBand, residualBand } from './bands'

/**
 * Material to the board, as the board paper reads it: residual or consequence
 * high, or accepted on the organisation's behalf. One definition, so the
 * paper's "required" and the decision about a material risk the board has
 * not heard about agree.
 */
export function materialScenario(scenario: RiskScenarioRuntime): boolean {
  return compareBands(residualBand(scenario.lastAssessed?.residual ?? 0), 'high') >= 0
    || compareBands(consequenceBand(scenario.lastAssessed?.consequence ?? 0), 'high') >= 0
    || scenario.status === 'accepted'
}

export function unreportedScenarios(state: GameState): RiskScenarioRuntime[] {
  const reported = new Set(state.reviews.quarters.filter((review) => review.completed).flatMap((review) => review.topicsChosen))
  return Object.values(state.risks.scenarios)
    .filter((s) => s.status !== 'emerging' && s.status !== 'closed' && !reported.has(`risk:${s.id}`))
    // Briefed to the chair counts as heard: "A material risk the board has
    // not heard about" came eleven days after one (73ad569 playtest, MN-32).
    .filter((s) => !s.escalatedToBoard)
    // Only what the paper would have required. A third raised risk the paper
    // let the player leave out as optional opened "A material risk the board
    // has not heard about" two days later (baf4cf9 playtest, MJ-20).
    .filter(materialScenario)
    .sort((a, b) => (b.lastAssessed?.residual ?? 0) - (a.lastAssessed?.residual ?? 0))
}
