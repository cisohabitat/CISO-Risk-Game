/**
 * Incident creation. Incidents emerge from world state (a campaign reaching its
 * objective) or, rarely, from an authored effect. Their severity is computed
 * from the controls that actually existed at the time, not from a script.
 */
import type { ContentIndex, GameState, IncidentRuntime, ThreatCampaignState } from '../types'
import { clamp01 } from '../types'
import { calculateRecoveryModifier } from '../risk/calculations'

export interface IncidentSeed {
  familyId: string
  campaign?: ThreatCampaignState
  actorId?: string
  pathId?: string
  detected?: boolean
}

export function createIncident(
  state: GameState,
  index: ContentIndex,
  seed: IncidentSeed,
): IncidentRuntime | undefined {
  const family = index.incidentFamily.get(seed.familyId)
  if (!family) return undefined

  const path = seed.pathId ? index.attackPath.get(seed.pathId) : undefined
  const affectedServiceIds = path?.impactedServiceIds ?? []

  state.incidents.counter += 1
  const id = `inc-${state.incidents.counter}`
  const recoveryModifier = calculateRecoveryModifier(state, index)

  const incident: IncidentRuntime = {
    id,
    familyId: family.id,
    campaignId: seed.campaign?.id,
    actorId: seed.actorId ?? seed.campaign?.actorId,
    pathId: seed.pathId ?? seed.campaign?.pathId,
    startedDay: state.currentDay,
    phase: 'signal',
    phaseEnteredDay: state.currentDay,
    containment: 0,
    recovery: 0,
    // Consequence starts from the family baseline, softened by recovery
    // capability that was already in place before the incident began.
    consequence: clamp01(family.baseDisruption * recoveryModifier),
    dataImpact: clamp01(family.baseDataImpact * recoveryModifier),
    affectedServiceIds,
    decisionsTaken: [],
    detectionDay: seed.detected ? state.currentDay : undefined,
    externalSupport: false,
    commandActivated: false,
  }
  state.incidents.incidents[id] = incident
  state.incidents.order.unshift(id)
  state.incidents.activeId = id
  if (seed.campaign) seed.campaign.incidentId = id
  return incident
}

export function activeIncidents(state: GameState): IncidentRuntime[] {
  return state.incidents.order
    .map((id) => state.incidents.incidents[id])
    .filter((incident): incident is IncidentRuntime => Boolean(incident) && incident.phase !== 'closed')
}
