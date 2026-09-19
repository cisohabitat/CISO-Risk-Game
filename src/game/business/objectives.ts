/**
 * Business objectives run whether or not the CISO helps (plan §20). Security
 * can protect, enable, delay or condition them — and the annual review reports
 * business outcomes alongside risk outcomes, so "block everything" loses.
 */
import type { ContentIndex, GameState } from '../types'
import { clamp01 } from '../types'

export interface ObjectiveTickResult {
  achieved: string[]
  failed: string[]
  atRisk: string[]
}

export function tickObjectives(state: GameState, index: ContentIndex): ObjectiveTickResult {
  const result: ObjectiveTickResult = { achieved: [], failed: [], atRisk: [] }

  for (const def of index.content.objectives) {
    const runtime = state.business.objectives[def.id]
    if (!runtime) continue
    if (runtime.status === 'achieved' || runtime.status === 'failed') continue

    // Delivery starts shortly after the year begins; these are the plans the
    // business already had when the CISO arrived.
    const startDay = Math.round(def.targetDay * 0.12)
    if (runtime.status === 'planned' && state.currentDay >= startDay) runtime.status = 'active'
    if (runtime.status === 'planned') continue

    const remaining = Math.max(1, runtime.targetDay - state.currentDay)
    const needed = 1 - runtime.progress
    const requiredRate = needed / remaining

    // Security friction. Live disruption, the drag of concurrent security
    // programmes, and an organisation that has run out of patience all slow
    // delivery. This is the mechanism that makes "secure everything" cost
    // something the business can see.
    let friction = 0
    for (const nodeId of def.dependencyNodeIds) {
      const health = state.business.serviceHealth[nodeId]
      if (health !== undefined) friction += (1 - health) * 0.8
    }
    for (const programme of Object.values(state.programmes.programmes)) {
      if (programme.status !== 'active' && programme.status !== 'at-risk') continue
      const programmeDef = index.programme.get(programme.id)
      if (!programmeDef) continue
      friction += programmeDef.businessFriction * 0.25
    }
    friction += Math.max(0, 0.45 - state.stakeholders.operationalTolerance) * 0.5
    const support = runtime.securitySupported ? 1.1 : 1
    // The nominal rate is set against the ORIGINAL target, so a delay pushes the
    // delivery date out rather than quietly making the objective easier.
    const span = Math.max(30, def.targetDay - startDay)
    const rate = (1 / (span * 0.9)) * support * clamp01(1 - friction)
    runtime.progress = clamp01(runtime.progress + rate)

    if (runtime.progress >= 1) {
      runtime.status = 'achieved'
      result.achieved.push(def.id)
      continue
    }
    if (state.currentDay > runtime.targetDay) {
      runtime.status = 'failed'
      result.failed.push(def.id)
      continue
    }
    const wasAtRisk = runtime.status === 'at-risk'
    if (requiredRate > rate * 1.35) {
      runtime.status = 'at-risk'
      if (!wasAtRisk) result.atRisk.push(def.id)
    } else if (wasAtRisk) {
      runtime.status = 'active'
    }
  }
  return result
}

/** Service health recovers gradually once an incident stops suppressing it. */
export function recoverServiceHealth(state: GameState, index: ContentIndex): void {
  const suppressed = new Set<string>()
  for (const incident of Object.values(state.incidents.incidents)) {
    if (incident.phase === 'closed' || incident.phase === 'debrief') continue
    for (const serviceId of incident.affectedServiceIds) {
      const service = index.service.get(serviceId)
      if (service) suppressed.add(service.nodeId)
    }
  }
  for (const [nodeId, health] of Object.entries(state.business.serviceHealth)) {
    if (suppressed.has(nodeId)) {
      state.business.outageDays[nodeId] = (state.business.outageDays[nodeId] ?? 0) + (health < 0.85 ? 1 : 0)
      continue
    }
    if (health < 1) state.business.serviceHealth[nodeId] = clamp01(health + 0.06)
  }
}

export function objectiveStatusLabel(status: string): string {
  switch (status) {
    case 'planned':
      return 'Planned'
    case 'active':
      return 'In delivery'
    case 'at-risk':
      return 'At risk'
    case 'achieved':
      return 'Achieved'
    default:
      return 'Missed'
  }
}
