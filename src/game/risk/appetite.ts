/** The adopted delegation is a recorded choice, not a hidden risk score.
 * Prior statements survive the year boundary through existing decision history. */
import type { ContentIndex, DecisionOptionDef, GameState, RiskScenarioRuntime } from '../types'
import { compareBands, residualBand } from './bands'

export interface AdoptedAppetite {
  policy: NonNullable<DecisionOptionDef['riskAppetite']>
  year: number
  day?: number
}

export function adoptedAppetite(state: GameState, index: ContentIndex): AdoptedAppetite | undefined {
  const current = Object.values(state.decisions.decisions)
    .filter((decision) => decision.resolvedDay !== undefined)
    .sort((a, b) => b.resolvedDay! - a.resolvedDay!)
  for (const decision of current) {
    const policy = index.decision.get(decision.defId)?.options.find((option) => option.id === decision.selectedOptionId)?.riskAppetite
    if (policy) return { policy, year: state.year ?? 1, day: decision.resolvedDay }
  }
  for (const year of [...(state.previousYears ?? [])].reverse()) {
    for (const [defId, optionId] of Object.entries(year.decisions)) {
      const policy = index.decision.get(defId)?.options.find((option) => option.id === optionId)?.riskAppetite
      if (policy) return { policy, year: year.year }
    }
  }
  return undefined
}

export function appetitePosition(risk: RiskScenarioRuntime, appetite: AdoptedAppetite): 'unassessed' | 'outside' | 'within' {
  if (!risk.lastAssessed) return 'unassessed'
  return compareBands(residualBand(risk.lastAssessed.residual), appetite.policy.delegatedResidualCeiling) > 0 ? 'outside' : 'within'
}

export function appetiteExceptions(state: GameState, index: ContentIndex) {
  const appetite = adoptedAppetite(state, index)
  if (!appetite) return []
  return Object.values(state.risks.scenarios)
    .filter((risk) => risk.status === 'accepted' && appetitePosition(risk, appetite) !== 'within')
    .flatMap((risk) => {
      const def = index.riskScenario.get(risk.id)
      return def ? [{ id: risk.id, title: def.title, position: appetitePosition(risk, appetite) }] : []
    })
}
