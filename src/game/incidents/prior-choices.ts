import type { ContentIndex, GameState, IncidentRuntime } from '../types'

/** Name recorded choices on the actual route. This is evidence of a carried
 * trade-off, not a counterfactual claim that one answer caused the incident. */
export function priorRouteChoices(state: GameState, index: ContentIndex, incident: IncidentRuntime) {
  const path = incident.pathId ? index.attackPath.get(incident.pathId) : undefined
  if (!path) return []
  const routeControls = new Set(path.steps.flatMap((step) => step.controlIds))
  const routeNodes = new Set(path.steps.map((step) => step.nodeId))
  return state.history.decisionsLog.filter((entry) => entry.day < incident.startedDay).slice().reverse().flatMap((entry) => {
    const runtime = state.decisions.decisions[entry.decisionId]
    const def = runtime ? index.decision.get(runtime.defId) : undefined
    const option = def?.options.find((item) => item.id === entry.optionId)
    if (!runtime || !def || !option) return []
    // A decision about named systems is cited only when the attack went
    // through one of them: the warehouse acceptance left segmentation weak,
    // and every route that crossed a segment blamed it (427b290 playtest,
    // MJ-29).
    if (def.relatedNodeIds && def.relatedNodeIds.length > 0 && !def.relatedNodeIds.some((id) => routeNodes.has(id))) return []
    const controls = new Set(option.unaddressedControlIds ?? [])
    for (const effect of option.immediateEffects) {
      if ('controlId' in effect && 'delta' in effect && (effect.type === 'control.exceptions' ? effect.delta > 0 : effect.delta < 0)) controls.add(effect.controlId)
    }
    const stillWeak = [...controls].filter((id) => {
      const control = state.controls.controls[id]
      return routeControls.has(id) && control && (control.coverage < 0.4 || control.operationalEffectiveness < 0.4 || control.exceptionRate > 0.3)
    })
    if (stillWeak.length === 0) return []
    // A default the budget forced is not a choice left untaken: every fix
    // read "more than the £0k left", the decision lapsed, and the
    // reconstruction blamed the lapse (73ad569 playtest, MJ-23).
    const pricedOut = runtime.resolvedByDefault === true && def.options.length > 1 && def.options.filter((item) => item.id !== option.id).every((item) => runtime.pricedOutOptionIds?.includes(item.id))
    const actor = pricedOut
      ? 'With every other option beyond the budget left, the deadline default selected'
      : runtime.resolvedByDefault === true ? 'The deadline default selected' : runtime.resolvedByDefault === false ? 'You chose' : 'The recorded choice was'
    return [{ decisionId: runtime.id, text: `${actor} "${option.label}" in "${def.title}" before this incident. ${stillWeak.map((id) => index.control.get(id)?.shortName ?? id).join(', ')} still showed a gap at reconstruction.` }]
  // The same choice made twice (the overload decision, asked each quarter)
  // read as one sentence printed twice (57c9605 playtest, CS-28).
  }).filter((choice, i, all) => all.findIndex((other) => other.text === choice.text) === i).slice(0, 2)
}
