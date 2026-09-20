/**
 * Runtime invariants (plan §42.2). A simulation can look fine while quietly
 * producing incoherent state, so these are checked in dev, in soak tests and
 * after loading a save.
 */
import type { ContentIndex, GameState } from '../types'
import { CAMPAIGN_DAYS, CYBER_FUNCTIONS } from '../types'

export interface InvariantViolation {
  rule: string
  detail: string
}

function inUnit(value: number): boolean {
  return Number.isFinite(value) && value >= -1e-9 && value <= 1 + 1e-9
}

export function checkInvariants(state: GameState, index: ContentIndex): InvariantViolation[] {
  const violations: InvariantViolation[] = []
  const add = (rule: string, detail: string) => violations.push({ rule, detail })

  if (!Number.isFinite(state.currentDay) || state.currentDay < 0 || state.currentDay > CAMPAIGN_DAYS) {
    add('day-in-range', `currentDay=${state.currentDay}`)
  }
  if (!Number.isFinite(state.resources.budgetRemaining)) {
    add('budget-finite', `budgetRemaining=${state.resources.budgetRemaining}`)
  }
  if (state.resources.focusRemaining < 0) {
    add('focus-non-negative', `focusRemaining=${state.resources.focusRemaining}`)
  }
  if (state.resources.budgetRemaining < 0) {
    add('budget-non-negative', `budgetRemaining=${state.resources.budgetRemaining}`)
  }

  for (const [id, control] of Object.entries(state.controls.controls)) {
    for (const [key, value] of Object.entries({
      coverage: control.coverage,
      configurationQuality: control.configurationQuality,
      operationalEffectiveness: control.operationalEffectiveness,
      monitoringQuality: control.monitoringQuality,
      exceptionRate: control.exceptionRate,
    })) {
      if (!inUnit(value)) add('control-unit-range', `${id}.${key}=${value}`)
    }
    if (!index.control.has(id)) add('control-exists-in-content', id)
  }

  for (const [id, node] of Object.entries(state.organisation.nodes)) {
    if (!index.node.has(id)) add('node-exists-in-content', id)
    if (!inUnit(node.exposure)) add('node-exposure-range', `${id}=${node.exposure}`)
    if (!inUnit(node.weakness)) add('node-weakness-range', `${id}=${node.weakness}`)
    if (node.discovered && !node.exists) add('undiscoverable-node-shown', id)
  }

  for (const [id, edge] of Object.entries(state.organisation.edges)) {
    if (!index.edge.has(id)) add('edge-exists-in-content', id)
    if (edge.discovered && !edge.exists) add('undiscoverable-edge-shown', id)
  }

  for (const fn of CYBER_FUNCTIONS) {
    const runtime = state.team.functions[fn]
    if (!runtime) {
      add('function-present', fn)
      continue
    }
    if (runtime.capacity < 0 || !Number.isFinite(runtime.capacity)) add('capacity-non-negative', `${fn}=${runtime.capacity}`)
    if (runtime.committed < -1e-6 || !Number.isFinite(runtime.committed)) {
      add('committed-non-negative', `${fn}=${runtime.committed}`)
    }
    if (!inUnit(runtime.morale)) add('morale-range', `${fn}=${runtime.morale}`)
  }

  for (const [id, decision] of Object.entries(state.decisions.decisions)) {
    if (decision.resolvedDay !== undefined && state.decisions.openIds.includes(id)) {
      add('resolved-decision-not-open', id)
    }
    if (decision.selectedOptionId !== undefined && decision.resolvedDay === undefined) {
      add('selected-option-requires-resolution', id)
    }
    if (!index.decision.has(decision.defId)) add('decision-def-exists', decision.defId)
  }
  const duplicates = state.decisions.resolvedIds.filter((id, i) => state.decisions.resolvedIds.indexOf(id) !== i)
  if (duplicates.length > 0) add('decision-resolved-once', duplicates.join(','))

  for (const evidenceId of state.evidence.order) {
    if (!index.evidence.has(evidenceId)) add('evidence-exists-in-content', evidenceId)
    if (!state.evidence.items[evidenceId]) add('evidence-order-matches-items', evidenceId)
  }

  for (const assumption of Object.values(state.assumptions.assumptions)) {
    if (!index.assumption.has(assumption.defId)) add('assumption-def-exists', assumption.defId)
    if (assumption.status === 'invalidated' && assumption.invalidatedDay === undefined) {
      add('invalidated-assumption-traceable', assumption.id)
    }
  }

  for (const incident of Object.values(state.incidents.incidents)) {
    if (!index.incidentFamily.has(incident.familyId)) add('incident-family-exists', incident.familyId)
    for (const serviceId of incident.affectedServiceIds) {
      if (!index.service.has(serviceId)) add('incident-service-exists', serviceId)
    }
    if (incident.pathId && !index.attackPath.has(incident.pathId)) add('incident-path-exists', incident.pathId)
  }

  for (const scenario of Object.values(state.risks.scenarios)) {
    if (!index.riskScenario.has(scenario.id)) add('scenario-exists-in-content', scenario.id)
    if (scenario.lastAssessed && !inUnit(scenario.lastAssessed.residual)) {
      add('residual-range', `${scenario.id}=${scenario.lastAssessed.residual}`)
    }
  }

  for (const campaign of state.threats.campaigns) {
    if (!index.attackPath.has(campaign.pathId)) add('campaign-path-exists', campaign.pathId)
    if (!index.actor.has(campaign.actorId)) add('campaign-actor-exists', campaign.actorId)
  }

  for (const person of Object.values(state.stakeholders.stakeholders)) {
    if (!inUnit(person.trust)) add('trust-range', `${person.id}=${person.trust}`)
  }
  if (!inUnit(state.stakeholders.boardConfidence)) {
    add('board-confidence-range', String(state.stakeholders.boardConfidence))
  }

  return violations
}

/** Cheap structural check that a state round-trips through JSON unchanged. */
export function assertSerialisable(state: GameState): void {
  const json = JSON.stringify(state)
  if (json === undefined) throw new Error('Game state is not serialisable')
  const parsed = JSON.parse(json) as GameState
  if (parsed.currentDay !== state.currentDay) throw new Error('Serialisation changed the game state')
}
