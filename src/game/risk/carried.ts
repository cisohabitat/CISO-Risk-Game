/**
 * Acceptances that came across from an earlier year: accepted, and not
 * accepted again this year. A year's history starts empty, so anything this
 * year's history records as accepted is this year's. "Last year's acceptances
 * still stand" named a risk the player had accepted the day before (AI
 * second-year re-test).
 */
import type { GameState, RiskScenarioRuntime } from '../types'

export function carriedAcceptances(state: GameState): RiskScenarioRuntime[] {
  if ((state.year ?? 1) < 2) return []
  const thisYear = new Set(
    state.history.entries.filter((entry) => entry.kind === 'risk-accepted').map((entry) => entry.refs?.[0]),
  )
  return Object.values(state.risks.scenarios).filter((s) => s.status === 'accepted' && !thisYear.has(s.id))
}
