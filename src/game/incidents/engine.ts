/**
 * Incident engine (plan §25). The CISO makes executive decisions only; the
 * simulation resolves containment, consequence and recovery from the controls,
 * people and choices that were actually in place.
 */
import { evaluateCondition } from '../events/conditions'
import { RISK_BAND_LABEL, consequenceBand } from '../risk/bands'
import type { Condition } from '../types'
import type { ContentIndex, GameEffect, GameState, IncidentRuntime } from '../types'
import { clamp01 } from '../types'
import type { Rng } from '../engine/rng'
import { calculateControlDetection, calculateControlRecovery } from '../controls/effectiveness'

export interface IncidentTickResult {
  effects: GameEffect[]
  /** Phase transitions worth telling the player about. */
  transitions: { incidentId: string; phase: IncidentRuntime['phase']; note: string }[]
  openDecisionIds: { incidentId: string; decisionId: string }[]
  interrupts: boolean
}

function irStrength(state: GameState, index: ContentIndex, incident: IncidentRuntime): number {
  const fn = state.team.functions['incident-response']
  const capacityFactor = fn ? clamp01((fn.capacity - fn.committed + 1) / Math.max(1, fn.capacity)) : 0.3
  const moraleFactor = fn ? 0.5 + 0.5 * fn.morale : 0.5
  let detection = 0
  for (const def of index.content.controls) {
    if (def.category !== 'detection' && def.category !== 'endpoint') continue
    const runtime = state.controls.controls[def.id]
    if (!runtime) continue
    detection = Math.max(detection, calculateControlDetection(runtime, def))
  }
  const command = incident.commandActivated ? 1.35 : 1
  const external = incident.externalSupport ? 1.25 : 1
  return clamp01(0.12 + (0.3 * capacityFactor + 0.35 * detection + 0.2 * moraleFactor) * command * external)
}

function recoveryStrength(state: GameState, index: ContentIndex): number {
  let best = 0
  for (const def of index.content.controls) {
    if (def.category !== 'recovery') continue
    const runtime = state.controls.controls[def.id]
    if (!runtime) continue
    best = Math.max(best, calculateControlRecovery(runtime, def))
  }
  return clamp01(0.08 + best)
}

/**
 * The family's authored lines, minus the ones the state says are not true.
 * They were appended unconditionally: a player who enforced the retention
 * policy on day 103 was told on day 216 that data held beyond policy had
 * hurt, and backups "that could not be reached" were credited beside a step
 * that encrypted them. Found by the third observed playthrough.
 */
function authoredLines(
  state: GameState,
  index: ContentIndex,
  lines: (string | { text: string; when: Condition })[] | undefined,
): string[] {
  return (lines ?? [])
    .filter((line) => typeof line === 'string' || evaluateCondition(state, index, line.when))
    .map((line) => (typeof line === 'string' ? line : line.text))
}

export function tickIncidents(state: GameState, index: ContentIndex, rng: Rng): IncidentTickResult {
  const result: IncidentTickResult = { effects: [], transitions: [], openDecisionIds: [], interrupts: false }

  for (const incidentId of state.incidents.order) {
    const incident = state.incidents.incidents[incidentId]
    if (!incident || incident.phase === 'closed') continue
    const family = index.incidentFamily.get(incident.familyId)
    if (!family) continue
    const daysInPhase = state.currentDay - incident.phaseEnteredDay

    const enter = (phase: IncidentRuntime['phase'], note: string) => {
      incident.phase = phase
      incident.phaseEnteredDay = state.currentDay
      result.transitions.push({ incidentId, phase, note })
    }

    switch (incident.phase) {
      case 'signal': {
        // Either the SOC sees it, or the business feels it.
        const noticed = incident.detectionDay !== undefined || rng.chance(0.35 + 0.3 * incident.consequence)
        if (noticed || daysInPhase >= 2) {
          if (incident.detectionDay === undefined) incident.detectionDay = state.currentDay
          enter('escalation', `${family.name} escalated to the CISO.`)
          result.interrupts = true
        }
        break
      }
      case 'escalation': {
        for (const decisionId of family.responseDecisionIds) {
          result.openDecisionIds.push({ incidentId, decisionId })
        }
        enter('containment', 'Response decisions are live; containment work has started.')
        result.interrupts = true
        break
      }
      case 'containment': {
        const strength = irStrength(state, index, incident)
        incident.containment = clamp01(incident.containment + strength * 0.22)
        // Unchecked, the consequence keeps growing while the actor operates.
        const growth = (1 - incident.containment) * 0.05 * (0.6 + 0.4 * (1 - state.stakeholders.operationalTolerance))
        incident.consequence = clamp01(incident.consequence + growth)
        incident.dataImpact = clamp01(incident.dataImpact + growth * 0.6)
        applyServiceDisruption(state, index, incident, result.effects)
        if (incident.containment >= 1 || daysInPhase > family.baseDurationDays * 2) {
          enter('consequence', 'The actor has been pushed out. The damage is now being counted.')
        }
        break
      }
      case 'consequence': {
        applyServiceDisruption(state, index, incident, result.effects)
        if (daysInPhase >= Math.max(1, Math.round(family.baseDurationDays * incident.consequence))) {
          enter('recovery', 'Restoration of affected services has begun.')
        }
        break
      }
      case 'recovery': {
        incident.recovery = clamp01(incident.recovery + recoveryStrength(state, index) * 0.3)
        applyServiceDisruption(state, index, incident, result.effects, incident.recovery)
        if (incident.recovery >= 1) {
          enter('debrief', 'Services are restored. Time to reconstruct what happened.')
        }
        break
      }
      case 'debrief': {
        incident.reconstruction = buildReconstruction(state, index, incident)
        incident.resolvedDay = state.currentDay
        // "Post-incident review complete" was the whole account a player got
        // of an incident a Skip ahead had carried them through. The facts the
        // player was entitled to — how long, which services, how bad, what
        // they decided — are in the message now; the route stays for the
        // annual review, which is where hidden truth is revealed.
        const services = incident.affectedServiceIds
          .map((id) => index.service.get(id)?.name)
          .filter((name): name is string => Boolean(name))
        // Response decisions only. Every choice made while an incident runs is
        // on its record, so answering the card data question mid-incident made
        // "4 response decisions" of the incident's three.
        const decided = incident.decisionsTaken.filter((taken) =>
          family.responseDecisionIds.includes(state.decisions.decisions[taken.decisionId]?.defId ?? ''),
        ).length
        enter(
          'closed',
          `Post-incident review complete. ${family.name} ran ${state.currentDay - incident.startedDay} days` +
            (services.length > 0 ? ` and touched ${services.join(', ')}` : '') +
            `; the consequence to the business was ${RISK_BAND_LABEL[consequenceBand(incident.consequence)].toLowerCase()}. ` +
            (decided > 0
              ? `You took ${decided} response decision${decided === 1 ? '' : 's'} while it ran. `
              : 'No response decision was taken while it ran. ') +
            'How the actor got in is for the year-end reconstruction.',
        )
        if (state.incidents.activeId === incidentId) state.incidents.activeId = undefined
        result.interrupts = true
        break
      }
      default:
        break
    }
  }

  return result
}

function applyServiceDisruption(
  state: GameState,
  index: ContentIndex,
  incident: IncidentRuntime,
  effects: GameEffect[],
  recovery = 0,
): void {
  const severity = clamp01(incident.consequence * (1 - incident.containment * 0.5) * (1 - recovery))
  for (const serviceId of incident.affectedServiceIds) {
    const service = index.service.get(serviceId)
    if (!service) continue
    const health = clamp01(1 - severity)
    const current = state.business.serviceHealth[service.nodeId] ?? 1
    state.business.serviceHealth[service.nodeId] = Math.min(current, health)
  }
  if (severity > 0.4) {
    for (const objective of index.content.objectives) {
      const runtime = state.business.objectives[objective.id]
      if (!runtime || runtime.status === 'achieved' || runtime.status === 'failed') continue
      if (!objective.dependencyNodeIds.some((nodeId) => incidentTouchesNode(index, incident, nodeId))) continue
      effects.push({ type: 'objective.delay', objectiveId: objective.id, days: 1 })
    }
  }
}

function incidentTouchesNode(index: ContentIndex, incident: IncidentRuntime, nodeId: string): boolean {
  for (const serviceId of incident.affectedServiceIds) {
    const service = index.service.get(serviceId)
    if (service?.nodeId === nodeId) return true
  }
  const path = incident.pathId ? index.attackPath.get(incident.pathId) : undefined
  return Boolean(path?.steps.some((step) => step.nodeId === nodeId))
}

/**
 * Reconstruction shows the path taken and what actually made a difference.
 * It never labels a past decision "correct" or "incorrect" (plan §25).
 */
export function buildReconstruction(
  state: GameState,
  index: ContentIndex,
  incident: IncidentRuntime,
): NonNullable<IncidentRuntime['reconstruction']> {
  const path = incident.pathId ? index.attackPath.get(incident.pathId) : undefined
  const family = index.incidentFamily.get(incident.familyId)
  const helped: string[] = []
  const hurt: string[] = []

  const pathSummary =
    path?.steps.map((step) => {
      const node = index.node.get(step.nodeId)
      const controlNames: string[] = []
      let blocked = false
      for (const controlId of step.controlIds) {
        const def = index.control.get(controlId)
        const runtime = state.controls.controls[controlId]
        if (!def || !runtime) continue
        controlNames.push(def.shortName)
        if (runtime.coverage > 0.7 && runtime.operationalEffectiveness > 0.6) blocked = true
      }
      return {
        stepId: step.id,
        nodeName: node?.name ?? step.nodeId,
        narrative: step.narrative,
        controlNames,
        wasBlocked: blocked,
      }
    }) ?? []

  for (const def of index.content.controls) {
    const runtime = state.controls.controls[def.id]
    if (!runtime) continue
    const relevant = path?.steps.some((step) => step.controlIds.includes(def.id)) ?? false
    if (!relevant) continue
    if (runtime.coverage > 0.7 && runtime.operationalEffectiveness > 0.6) {
      helped.push(`${def.name} was in place and operating across most of the estate`)
    } else if (runtime.coverage < 0.4) {
      hurt.push(`${def.name} covered only part of the estate`)
    } else if (runtime.exceptionRate > 0.3) {
      hurt.push(`${def.name} carried a large standing exception population`)
    }
  }
  if (incident.commandActivated) helped.push('Incident command was stood up early')
  else hurt.push('Incident command was never formally stood up')
  if (incident.externalSupport) helped.push('External response support was brought in')
  // Detection is read from when the intrusion began, not from when it reached
  // the business. "Detected almost immediately" sat beside three weak
  // signals, a month apart, on the exact route the reconstruction then drew
  // (AI veteran playtest, 2026-10-09): the incident was seen at once, the
  // intrusion behind it was not acted on.
  const campaign = incident.campaignId ? state.threats.campaigns.find((c) => c.id === incident.campaignId) : undefined
  const ranFor = campaign ? incident.startedDay - campaign.startedDay : 0
  const warnings = incident.campaignId
    ? Object.keys(state.flags).filter((flag) => flag.startsWith(`signal.${incident.campaignId}.`)).length
    : 0
  const weeks = Math.max(1, Math.round(ranFor / 7))
  // First, because the lists are cut at six and the narrative reads three:
  // how long it ran unseen is the line the year turns on.
  if (ranFor > 7 && warnings > 0) {
    hurt.unshift(
      `The intrusion raised ${warnings === 1 ? 'a warning' : `${warnings} warnings`} over ${weeks === 1 ? 'a week' : `${weeks} weeks`} before it reached the business, and none of them was followed up`,
    )
  } else if (ranFor > 7) {
    hurt.unshift(`The intrusion was under way for ${weeks === 1 ? 'a week' : `${weeks} weeks`} before it reached the business, and nothing saw it`)
  } else if (incident.detectionDay !== undefined && incident.detectionDay - incident.startedDay <= 1) {
    helped.unshift('The activity was detected almost immediately')
  } else if (incident.detectionDay !== undefined && incident.detectionDay - incident.startedDay > 5) {
    hurt.unshift('The activity ran for several days before anyone noticed')
  }

  const relatedAssumptions = Object.values(state.assumptions.assumptions)
    .filter((assumption) =>
      assumption.linkedNodeIds.some((nodeId) => incidentTouchesNode(index, incident, nodeId)),
    )
    .map((assumption) => assumption.id)

  const relatedDecisions = state.history.decisionsLog
    .filter((entry) => entry.day <= incident.startedDay)
    .slice(-6)
    .map((entry) => entry.decisionId)

  const narrative = [
    family?.headline ?? 'An incident ran its course.',
    path ? `The route ran ${pathSummary.map((s) => s.nodeName).join(' → ')}.` : '',
    helped.length > 0 ? `What helped: ${helped.slice(0, 3).join('; ')}.` : 'Little in place helped.',
    hurt.length > 0 ? `What hurt: ${hurt.slice(0, 3).join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    pathSummary,
    helped: helped.concat(authoredLines(state, index, family?.whatHelped)).slice(0, 6),
    hurt: hurt.concat(authoredLines(state, index, family?.whatHurt)).slice(0, 6),
    relatedDecisionIds: relatedDecisions,
    relatedAssumptionIds: relatedAssumptions,
    narrative,
  }
}
