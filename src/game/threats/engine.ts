/**
 * Threat actor engine (plan §16).
 *
 * Actors are not scripted. Each day they weigh a small set of precomputed
 * candidate attack paths, and progress along one step at a time. Controls
 * change the odds per step; monitoring decides whether the defender ever finds
 * out. The player normally sees evidence, not the attacker's true stage.
 */
import type {
  AttackPathDef,
  CampaignStage,
  ContentIndex,
  GameEffect,
  GameState,
  ThreatCampaignState,
} from '../types'
import { CAMPAIGN_STAGES, clamp01 } from '../types'
import type { Rng } from '../engine/rng'
import { assessPathSteps, calculatePathViability, calculateThreatPressure } from '../risk/calculations'

export interface ThreatTickResult {
  effects: GameEffect[]
  /** Signals the SOC can raise; the event engine turns these into narrative. */
  signals: {
    campaignId: string
    actorId: string
    pathId: string
    stage: CampaignStage
    nodeId: string
    strength: 'faint' | 'clear'
  }[]
  newCampaigns: string[]
  disrupted: string[]
  breaches: { campaignId: string; pathId: string; actorId: string; familyId: string }[]
}

function stageForStep(stepIndex: number, stepCount: number): CampaignStage {
  if (stepCount <= 1) return 'action-on-objective'
  const span = CAMPAIGN_STAGES.length - 2 // interest..target-access
  const ratio = stepIndex / Math.max(1, stepCount - 1)
  const idx = Math.min(span, 1 + Math.round(ratio * (span - 1)))
  return CAMPAIGN_STAGES[idx] ?? 'reconnaissance'
}

/** How attractive an organisation looks to an actor right now. */
export function pathAttractiveness(
  state: GameState,
  index: ContentIndex,
  path: AttackPathDef,
  actorId: string,
): number {
  const affinity = path.actorAffinity[actorId] ?? 0
  if (affinity <= 0) return 0
  const viability = calculatePathViability(state, index, path)
  return clamp01(affinity * path.attractiveness * (0.2 + 0.8 * viability))
}

export function tickThreats(state: GameState, index: ContentIndex, rng: Rng): ThreatTickResult {
  const result: ThreatTickResult = {
    effects: [],
    signals: [],
    newCampaigns: [],
    disrupted: [],
    breaches: [],
  }

  const difficultyFactor = state.difficulty === 'guided' ? 0.72 : state.difficulty === 'high-pressure' ? 1.28 : 1

  // 1. Actor mood. Interest tracks how exposed the organisation currently looks.
  for (const def of index.content.actors) {
    const actor = state.threats.actors[def.id]
    if (!actor) continue
    let bestAttractiveness = 0
    for (const path of index.content.attackPaths) {
      bestAttractiveness = Math.max(bestAttractiveness, pathAttractiveness(state, index, path, def.id))
    }
    const target = clamp01(0.35 * state.threats.sectorPressure + 0.65 * bestAttractiveness)
    actor.interest = clamp01(actor.interest + (target - actor.interest) * 0.02 + rng.jitter(0.004))
    actor.activityLevel = clamp01(actor.activityLevel + rng.jitter(0.008))
    actor.pressure = calculateThreatPressure(state, index, def.id)
  }

  // 2. New campaigns. One live campaign per actor keeps the story legible.
  for (const def of index.content.actors) {
    const actor = state.threats.actors[def.id]
    if (!actor) continue
    if (actor.setbackUntilDay !== undefined && state.currentDay < actor.setbackUntilDay) continue
    const live = state.threats.campaigns.some(
      (c) => c.actorId === def.id && !c.disrupted && !c.incidentId,
    )
    if (live) continue
    const cooldown = actor.lastCampaignDay === undefined ? 999 : state.currentDay - actor.lastCampaignDay
    if (cooldown < 45) continue
    // One incident at a time keeps the story legible and the year survivable.
    const incidentRunning = Object.values(state.incidents.incidents).some((i) => i.phase !== 'closed')
    if (incidentRunning) continue

    const candidates = index.content.attackPaths
      .map((path) => ({ path, weight: pathAttractiveness(state, index, path, def.id) }))
      .filter((entry) => entry.weight > 0.02)
    if (candidates.length === 0) continue

    const startChance = clamp01(actor.pressure * def.persistence * 0.006 * difficultyFactor)
    if (!rng.chance(startChance)) continue

    const chosen = rng.weighted(candidates, (entry) => entry.weight)
    if (!chosen) continue

    const campaign: ThreatCampaignState = {
      id: `camp-${state.threats.campaigns.length + 1}-${state.currentDay}`,
      actorId: def.id,
      pathId: chosen.path.id,
      stage: 'interest',
      stepIndex: 0,
      stepProgress: 0,
      startedDay: state.currentDay,
      lastAdvanceDay: state.currentDay,
      detected: false,
      disrupted: false,
      evidenceRaisedIds: [],
    }
    state.threats.campaigns.push(campaign)
    actor.lastCampaignDay = state.currentDay
    result.newCampaigns.push(campaign.id)
  }

  // 3. Progress live campaigns one step at a time.
  for (const campaign of state.threats.campaigns) {
    if (campaign.disrupted || campaign.incidentId) continue
    const path = index.attackPath.get(campaign.pathId)
    const actorDef = index.actor.get(campaign.actorId)
    const actor = state.threats.actors[campaign.actorId]
    if (!path || !actorDef || !actor) continue

    const assessments = assessPathSteps(state, index, path)
    const step = path.steps[campaign.stepIndex]
    const assessment = assessments[campaign.stepIndex]
    if (!step || !assessment) continue

    campaign.stage = stageForStep(campaign.stepIndex, path.steps.length)

    // Effort roll: capable, persistent actors make progress more often.
    const effort = clamp01(0.25 + 0.75 * actorDef.capability) * (0.6 + 0.4 * actor.activityLevel)
    const dailyChance = clamp01(assessment.passChance * effort * 0.3 * difficultyFactor)
    const advanced = rng.chance(dailyChance)

    // Detection is rolled on activity whether or not the step succeeds: noisy
    // failures are often how defenders find out at all.
    const detectionChance = clamp01(assessment.detectionChance * (advanced ? 0.55 : 0.34))
    if (rng.chance(detectionChance)) {
      campaign.detected = true
      campaign.detectedStage = campaign.stage
      result.signals.push({
        campaignId: campaign.id,
        actorId: campaign.actorId,
        pathId: campaign.pathId,
        stage: campaign.stage,
        nodeId: step.nodeId,
        strength: assessment.detectionChance > 0.45 ? 'clear' : 'faint',
      })

      // A capable SOC that sees it can also push the actor back out.
      const disruptChance = clamp01(assessment.detectionChance * assessment.resistance * 0.5)
      if (rng.chance(disruptChance)) {
        campaign.disrupted = true
        campaign.disruptedDay = state.currentDay
        result.disrupted.push(campaign.id)
        actor.setbackUntilDay = state.currentDay + 30
        continue
      }
    }

    if (!advanced) {
      // Actors give up on stubborn paths eventually.
      if (state.currentDay - campaign.lastAdvanceDay > 70 + actorDef.persistence * 60) {
        campaign.disrupted = true
        campaign.disruptedDay = state.currentDay
        result.disrupted.push(campaign.id)
      }
      continue
    }

    campaign.lastAdvanceDay = state.currentDay
    campaign.stepIndex += 1
    campaign.stepProgress = 0

    if (campaign.stepIndex >= path.steps.length) {
      campaign.stage = 'action-on-objective'
      result.breaches.push({
        campaignId: campaign.id,
        pathId: path.id,
        actorId: campaign.actorId,
        familyId: path.incidentFamilyId,
      })
    } else {
      campaign.stage = stageForStep(campaign.stepIndex, path.steps.length)
    }
  }

  // Keep the campaign list bounded; resolved history lives in HistoryState.
  if (state.threats.campaigns.length > 40) {
    state.threats.campaigns = state.threats.campaigns.filter(
      (c) => !c.disrupted || state.currentDay - (c.disruptedDay ?? 0) < 120,
    )
  }

  return result
}

/** Sector-wide pressure wanders and is nudged by world events. */
export function driftSectorPressure(state: GameState, rng: Rng): void {
  const pull = state.difficulty === 'high-pressure' ? 0.62 : state.difficulty === 'guided' ? 0.34 : 0.48
  state.threats.sectorPressure = clamp01(
    state.threats.sectorPressure + (pull - state.threats.sectorPressure) * 0.01 + rng.jitter(0.012),
  )
}

export function stageLabel(stage: CampaignStage): string {
  switch (stage) {
    case 'interest':
      return 'Interest'
    case 'reconnaissance':
      return 'Reconnaissance'
    case 'initial-access':
      return 'Attempted access'
    case 'foothold':
      return 'Foothold'
    case 'lateral-movement':
      return 'Lateral movement'
    case 'target-access':
      return 'Target access'
    default:
      return 'Action on objective'
  }
}
