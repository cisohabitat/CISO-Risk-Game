import type { ContentIndex, GameState, IncidentRuntime } from '../types'

/** Name recorded choices on the actual route. This is evidence of a carried
 * trade-off, not a counterfactual claim that one answer caused the incident. */
export function priorRouteChoices(state: GameState, index: ContentIndex, incident: IncidentRuntime) {
  const path = incident.pathId ? index.attackPath.get(incident.pathId) : undefined
  if (!path) return []
  const routeControls = new Set(path.steps.flatMap((step) => step.controlIds))
  return state.history.decisionsLog.filter((entry) => entry.day < incident.startedDay).slice().reverse().flatMap((entry) => {
    const runtime = state.decisions.decisions[entry.decisionId]
    const def = runtime ? index.decision.get(runtime.defId) : undefined
    const option = def?.options.find((item) => item.id === entry.optionId)
    if (!runtime || !def || !option) return []
    const controls = new Set(option.unaddressedControlIds ?? [])
    for (const effect of option.immediateEffects) {
      if ('controlId' in effect && 'delta' in effect && (effect.type === 'control.exceptions' ? effect.delta > 0 : effect.delta < 0)) controls.add(effect.controlId)
    }
    const stillWeak = [...controls].filter((id) => {
      const control = state.controls.controls[id]
      return routeControls.has(id) && control && (control.coverage < 0.4 || control.operationalEffectiveness < 0.4 || control.exceptionRate > 0.3)
    })
    if (stillWeak.length === 0) return []
    const actor = runtime.resolvedByDefault === true ? 'The deadline default selected' : runtime.resolvedByDefault === false ? 'You chose' : 'The recorded choice was'
    return [{ decisionId: runtime.id, text: `${actor} "${option.label}" in "${def.title}" before this incident. ${stillWeak.map((id) => index.control.get(id)?.shortName ?? id).join(', ')} still showed a gap at reconstruction.` }]
  }).slice(0, 2)
}
