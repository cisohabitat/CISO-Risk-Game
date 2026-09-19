/**
 * Composable risk functions (plan §15). Deliberately small and independently
 * testable: there is no single monolithic risk formula, and none of these
 * numbers is ever shown to the player directly — see bands.ts.
 */
import type {
  AttackPathDef,
  ContentIndex,
  GameState,
  OrgNodeState,
  RiskScenarioDef,
} from '../types'
import { clamp01 } from '../types'
import { calculateControlRecovery, detectionAcross, resistanceToTechnique } from '../controls/effectiveness'

export interface StepAssessment {
  stepId: string
  nodeId: string
  /** Probability an attacker gets through this step in a day of effort. */
  passChance: number
  /** Probability defenders see the activity at this step. */
  detectionChance: number
  resistance: number
  exposure: number
}

function controlsFor(state: GameState, index: ContentIndex, controlIds: string[]) {
  const out: { runtime: (typeof state.controls.controls)[string]; def: NonNullable<ReturnType<ContentIndex['control']['get']>> }[] = []
  for (const id of controlIds) {
    const def = index.control.get(id)
    const runtime = state.controls.controls[id]
    if (def && runtime) out.push({ runtime, def })
  }
  return out
}

/** Node-level exposure, raised while a service is already degraded. */
function nodeExposure(node: OrgNodeState | undefined): number {
  if (!node || !node.exists) return 0
  return clamp01(node.exposure)
}

/**
 * Per-step viability for one attack path.
 * Higher inherent difficulty and stronger relevant controls both reduce the
 * daily pass chance; exposure and weakness of the node raise it.
 */
export function assessPathSteps(
  state: GameState,
  index: ContentIndex,
  path: AttackPathDef,
): StepAssessment[] {
  return path.steps.map((step) => {
    const node = state.organisation.nodes[step.nodeId]
    const controls = controlsFor(state, index, step.controlIds)
    const resistance = resistanceToTechnique(step.technique, controls)
    const exposure = nodeExposure(node)
    const weakness = node ? clamp01(node.weakness) : 0.2
    const opportunity = clamp01((0.25 + 0.75 * exposure) * (0.3 + 0.7 * weakness) * (1 - step.difficulty * 0.7))
    const passChance = clamp01(opportunity * (1 - resistance * 0.92))
    return {
      stepId: step.id,
      nodeId: step.nodeId,
      passChance,
      detectionChance: detectionAcross(controls),
      resistance,
      exposure,
    }
  })
}

/**
 * Viability of the whole path: the product of step chances, normalised so that
 * long paths are not automatically negligible. A path through a missing node is
 * not viable at all.
 */
export function calculatePathViability(
  state: GameState,
  index: ContentIndex,
  path: AttackPathDef,
): number {
  for (const step of path.steps) {
    const node = state.organisation.nodes[step.nodeId]
    if (!node || !node.exists) return 0
  }
  const steps = assessPathSteps(state, index, path)
  if (steps.length === 0) return 0
  let product = 1
  for (const step of steps) product *= clamp01(step.passChance)
  // Geometric mean keeps long and short paths comparable.
  return clamp01(Math.pow(product, 1 / steps.length))
}

/** How interesting the organisation currently looks to a given actor. */
export function calculateThreatPressure(
  state: GameState,
  index: ContentIndex,
  actorId: string,
): number {
  const actor = state.threats.actors[actorId]
  const def = index.actor.get(actorId)
  if (!actor || !def) return 0
  const sector = clamp01(state.threats.sectorPressure)
  return clamp01(
    0.45 * clamp01(actor.activityLevel) +
      0.35 * clamp01(actor.interest) +
      0.2 * sector,
  )
}

/** Business consequence if the path's objective is achieved. */
export function calculateConsequence(
  state: GameState,
  index: ContentIndex,
  serviceIds: string[],
  severity: number,
): number {
  let weighted = 0
  let totalWeight = 0
  for (const serviceId of serviceIds) {
    const service = index.service.get(serviceId)
    if (!service) continue
    const node = state.organisation.nodes[service.nodeId]
    const criticality = node?.criticalityOverride ?? index.node.get(service.nodeId)?.criticality ?? 'medium'
    const criticalityWeight =
      criticality === 'critical' ? 1 : criticality === 'high' ? 0.78 : criticality === 'medium' ? 0.5 : 0.28
    const regulatory = clamp01(service.regulatoryExposure)
    const toleranceFactor = clamp01(1 - service.outageToleranceHours / 96)
    const value = criticalityWeight * (0.6 + 0.4 * regulatory) * (0.55 + 0.45 * toleranceFactor)
    weighted += value * service.revenueShare
    totalWeight += service.revenueShare
  }
  const base = totalWeight > 0 ? weighted / totalWeight : 0.4
  const concentration = calculateDependencyAmplifier(state, index, serviceIds)
  return clamp01(base * clamp01(severity) * concentration)
}

/**
 * Dependency concentration: services leaning on the same identity, platform or
 * supplier amplify one another's consequence.
 */
export function calculateDependencyAmplifier(
  state: GameState,
  index: ContentIndex,
  serviceIds: string[],
): number {
  const shared = new Map<string, number>()
  for (const serviceId of serviceIds) {
    const service = index.service.get(serviceId)
    if (!service) continue
    for (const edge of index.outgoing.get(service.nodeId) ?? []) {
      const edgeState = state.organisation.edges[edge.id]
      if (!edgeState || !edgeState.exists) continue
      shared.set(edge.to, (shared.get(edge.to) ?? 0) + 1)
    }
  }
  let maxShare = 1
  for (const count of shared.values()) maxShare = Math.max(maxShare, count)
  return clamp01(0.85 + 0.09 * (maxShare - 1)) + 0.15
}

/** How much recovery capability blunts the consequence once it lands. */
export function calculateRecoveryModifier(state: GameState, index: ContentIndex): number {
  let best = 0
  for (const def of index.content.controls) {
    if (def.recoveryStrength <= 0) continue
    const runtime = state.controls.controls[def.id]
    if (!runtime) continue
    best = Math.max(best, calculateControlRecovery(runtime, def))
  }
  // Even excellent recovery never removes all consequence.
  return clamp01(1 - best * 0.7)
}

export interface ScenarioAssessment {
  scenarioId: string
  exposure: number
  consequence: number
  residual: number
  bestPathId?: string
  uncertainty: number
}

/**
 * Residual exposure for an authored risk scenario: the most viable of its
 * attack paths, pressed by the interested actors, against its consequence.
 */
export function assessScenario(
  state: GameState,
  index: ContentIndex,
  def: RiskScenarioDef,
): ScenarioAssessment {
  let bestViability = 0
  let bestPathId: string | undefined
  let severity = 0.5
  for (const pathId of def.attackPathIds) {
    const path = index.attackPath.get(pathId)
    if (!path) continue
    const viability = calculatePathViability(state, index, path)
    if (viability > bestViability) {
      bestViability = viability
      bestPathId = pathId
      const family = index.incidentFamily.get(path.incidentFamilyId)
      severity = family ? family.baseDisruption : 0.5
    }
  }
  let pressure = 0
  for (const actorId of def.threatActorIds) {
    pressure = Math.max(pressure, calculateThreatPressure(state, index, actorId))
  }
  const exposure = clamp01(bestViability * (0.35 + 0.65 * pressure))
  const rawConsequence = calculateConsequence(state, index, def.affectedServiceIds, severity)
  const consequence = clamp01(rawConsequence * calculateRecoveryModifier(state, index))
  const residual = clamp01(Math.sqrt(exposure * consequence))
  const uncertainty = calculateUncertainty(state, index, def)
  return { scenarioId: def.id, exposure, consequence, residual, bestPathId, uncertainty }
}

/**
 * How much of this scenario the player actually understands. Undiscovered
 * nodes and unassessed controls both widen the uncertainty band, which is what
 * the UI shows instead of false precision.
 */
export function calculateUncertainty(
  state: GameState,
  index: ContentIndex,
  def: RiskScenarioDef,
): number {
  const nodeIds = new Set<string>(def.triggerNodeIds)
  for (const pathId of def.attackPathIds) {
    const path = index.attackPath.get(pathId)
    if (!path) continue
    for (const step of path.steps) nodeIds.add(step.nodeId)
  }
  let known = 0
  let total = 0
  for (const nodeId of nodeIds) {
    const node = state.organisation.nodes[nodeId]
    if (!node || !node.exists) continue
    total += 1
    if (node.discovered) known += node.discoveryConfidence
  }
  const discoveryGap = total > 0 ? 1 - known / total : 1

  let assessed = 0
  let controlCount = 0
  for (const pathId of def.attackPathIds) {
    const path = index.attackPath.get(pathId)
    if (!path) continue
    for (const step of path.steps) {
      for (const controlId of step.controlIds) {
        const runtime = state.controls.controls[controlId]
        if (!runtime) continue
        controlCount += 1
        if (runtime.believed && state.currentDay - runtime.believed.assessedOnDay < 120) assessed += 1
      }
    }
  }
  const assuranceGap = controlCount > 0 ? 1 - assessed / controlCount : 1
  return clamp01(0.6 * discoveryGap + 0.4 * assuranceGap)
}
