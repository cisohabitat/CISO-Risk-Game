/**
 * Incident engine (plan §25). The CISO makes executive decisions only; the
 * simulation resolves containment, consequence and recovery from the controls,
 * people and choices that were actually in place.
 */
import { priorRouteChoices } from './prior-choices'
import { BOARD_CHAIR, boardHearsElsewhere, boardOnClose } from './board'
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
  /** Findings letters that arrive with a later response stage, and the board's letters. */
  findings: { incidentId: string; from: string; subject: string; body: string; board?: boolean }[]
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

/**
 * Days of delivery every objective loses per unit of consequence above the
 * floor: a moderate incident stays with the security team, a severe one takes
 * the organisation with it (0.5 costs 8 days, 0.7 costs 16, 0.9 costs 24).
 * 60 until 27 November: with the mid-year incident floor and delays that
 * pause, a competent CISO player met 2.6 objectives and was Credible in 2 of
 * 25 years. At 40 they meet 3.1, where they were before 25 November.
 */
const DIVERSION_DAYS = 40
/** Below this consequence the response stays with the security team. */
const DIVERSION_FLOOR = 0.3

export function tickIncidents(state: GameState, index: ContentIndex, rng: Rng): IncidentTickResult {
  const result: IncidentTickResult = { effects: [], transitions: [], openDecisionIds: [], findings: [], interrupts: false }

  for (const incidentId of state.incidents.order) {
    const incident = state.incidents.incidents[incidentId]
    if (!incident || incident.phase === 'closed') continue
    const family = index.incidentFamily.get(incident.familyId)
    if (!family) continue
    const daysInPhase = state.currentDay - incident.phaseEnteredDay

    const heard = boardHearsElsewhere(state, incident, family)
    if (heard) {
      result.effects.push(...heard.effects)
      result.findings.push({ incidentId, from: BOARD_CHAIR, ...heard.letter, board: true })
    }

    // Later response stages open as the organisation learns more, while
    // the incident is still being handled.
    const stages = family.responseStages ?? []
    if (incident.responseStartedDay !== undefined && incident.phase !== 'debrief') {
      while ((incident.stagesOpened ?? 0) < stages.length) {
        const stage = stages[incident.stagesOpened ?? 0]!
        if (state.currentDay - incident.responseStartedDay < stage.afterDays) break
        for (const decisionId of stage.decisionIds) result.openDecisionIds.push({ incidentId, decisionId })
        result.findings.push({ incidentId, from: stage.from, subject: stage.subject, body: authoredLines(state, index, stage.findings).join(' ') })
        incident.stagesOpened = (incident.stagesOpened ?? 0) + 1
        result.interrupts = true
      }
    }

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
        const later = new Set(stages.flatMap((stage) => stage.decisionIds))
        for (const decisionId of family.responseDecisionIds) {
          if (!later.has(decisionId)) result.openDecisionIds.push({ incidentId, decisionId })
        }
        incident.responseStartedDay = state.currentDay
        incident.stagesOpened = 0
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
          // The whole organisation was in the response, not only the services
          // it touched: every objective in delivery loses days to it, scaled
          // by how bad it was. Without this a cost-cutter's ransomware year met
          // all five objectives (fresh-build 15-run replay, November).
          if (incident.consequence >= DIVERSION_FLOOR) {
            // A rehearsed recovery gets people back to their own work sooner:
            // the passive year that met every objective after three weeks of
            // ransomware, and the prepared one held to one of five, read the
            // same response the same way (42e2b80 playtest, runs 11 and 8).
            const preparedness = 1.5 - recoveryStrength(state, index)
            const days = Math.round(DIVERSION_DAYS * (incident.consequence - DIVERSION_FLOOR) * preparedness)
            for (const objective of index.content.objectives) {
              const runtime = state.business.objectives[objective.id]
              if (!runtime || runtime.status === 'achieved' || runtime.status === 'failed') continue
              result.effects.push({ type: 'objective.delay', objectiveId: objective.id, days, cause: `the response to the ${(index.incidentFamily.get(incident.familyId)?.name ?? 'incident').toLowerCase()}` })
            }
          }
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
        const reading = boardOnClose(state, index, incident, family)
        if (reading) {
          result.effects.push(...reading.effects)
          result.findings.push({ incidentId, from: BOARD_CHAIR, ...reading.letter, board: true })
        }
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
        // Its reflection follows the next day, every time. It came 9 or 10
        // days late, when it came at all, and a third incident had none
        // (427b290 playtest, MJ-01; owner, 28 November).
        for (const def of index.content.events) {
          if (def.incidentContext === 'latest-closed') state.events.scheduled.push({ eventId: def.id, day: state.currentDay + 1 })
        }
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
      effects.push({ type: 'objective.delay', objectiveId: objective.id, days: 1, cause: `disruption from the ${(index.incidentFamily.get(incident.familyId)?.name ?? 'incident').toLowerCase()}` })
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

  // Generic lines for the controls on the route, after the family's own
  // lines, and none for a control the family already speaks about: the
  // ransomware family's EDR line said what a generic one would repeat.
  const controlHelped: string[] = []
  const controlHurt: string[] = []
  const authoredControls = new Set(
    [...(family?.whatHelped ?? []), ...(family?.whatHurt ?? [])]
      .flatMap((line) => (typeof line !== 'string' && evaluateCondition(state, index, line.when) ? [line.when] : []))
      .flatMap((when) => ('controlId' in when && typeof when.controlId === 'string' ? [when.controlId] : [])),
  )
  for (const def of index.content.controls) {
    const runtime = state.controls.controls[def.id]
    if (!runtime || authoredControls.has(def.id)) continue
    const relevant = path?.steps.some((step) => step.controlIds.includes(def.id)) ?? false
    if (!relevant) continue
    if (runtime.coverage > 0.7 && runtime.operationalEffectiveness > 0.6) {
      controlHelped.push(`${def.name} was in place and operating across most of the estate`)
      continue
    }
    // A control on the route that did not hold failed in one of three ways,
    // and a practitioner wants to know which (14 November): MFA at its
    // starting levels sat between the old two thresholds and was not
    // mentioned at all.
    const lines = def.reconstructionLines
    if (runtime.coverage < 0.6) controlHurt.push(lines?.missing ?? `${def.name} covered only part of the estate`)
    else if (runtime.exceptionRate >= 0.25) controlHurt.push(lines?.bypassed ?? `${def.name} carried a large standing exception population`)
    else controlHurt.push(lines?.ineffective ?? `${def.name} was in place but not working well enough to stop it`)
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
  const firstWarning = state.inbox.messages.filter((message) => message.signalCampaignId === incident.campaignId).reduce((day, message) => Math.min(day, message.day), Infinity)
  // Any hunt that ran while the intrusion was under way counts, whenever it
  // was commissioned: hunts on 5 February and 19 August were followed by "no
  // targeted hunt was commissioned between the first warning and impact"
  // (73ad569 playtest, MJ-04).
  const intrusionFrom = Math.min(campaign?.startedDay ?? firstWarning, firstWarning)
  const hunts = state.team.assignments.filter((assignment) => assignment.refId === 'inv-threat-hunt'
    && assignment.startedDay < incident.startedDay
    && (assignment.dueDay ?? assignment.startedDay) >= intrusionFrom)
  const huntNote = hunts.some((assignment) => assignment.status === 'complete' && assignment.dueDay <= incident.startedDay)
    ? 'a targeted hunt returned while it was under way, but did not find it, and the intrusion still reached the business'
    : hunts.length > 0 ? 'a targeted hunt was under way before impact but had not returned'
      // Not blamed when no hunt could be commissioned at any warning: the
      // budget or the SOC could not take one (5033820 playtest, MJ-25).
      // Said without "could not be commissioned" when hunts ran at other
      // times: three hunts were commissioned in that year (57c9605 playtest,
      // MJ-15).
      : warningsUnhuntable(state, incident.campaignId)
        ? state.team.assignments.some((assignment) => assignment.refId === 'inv-threat-hunt' && assignment.status !== 'abandoned')
          ? 'no hunt you commissioned was running while it was under way, and when its warnings came the budget or the SOC could not take another'
          : 'no targeted hunt could be commissioned at any warning, because the budget or the SOC could not take one'
      : 'no targeted hunt ran between the first warning and impact'
  const weeks = Math.max(1, Math.round(ranFor / 7))
  // First, because the lists are cut at six and the narrative reads three:
  // how long it ran unseen is the line the year turns on.
  if (ranFor > 7 && warnings > 0) {
    hurt.unshift(
      `The intrusion ran for ${weeks === 1 ? 'a week' : `${weeks} weeks`} before it reached the business. It raised ${warnings === 1 ? 'a warning' : `${warnings} warnings`}, and ${huntNote}`,
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

  const priorChoices = priorRouteChoices(state, index, incident)
  hurt.splice(0, 0, ...priorChoices.map((choice) => choice.text))
  helped.push(...authoredLines(state, index, family?.whatHelped), ...controlHelped)
  hurt.push(...authoredLines(state, index, family?.whatHurt), ...controlHurt)
  const narrative = [
    family?.headline ?? 'An incident ran its course.',
    path ? `The route ran ${pathSummary.map((s) => s.nodeName).join(' → ')}.` : '',
    helped.length > 0 ? `What helped: ${helped.slice(0, 3).join('; ')}.` : 'Little in place helped.',
    hurt.length > 0 ? `What hurt: ${hurt.slice(0, 3).join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    assessedDay: state.currentDay,
    warningMessageIds: incident.campaignId
      ? state.inbox.messages.filter((message) => message.signalCampaignId === incident.campaignId && message.day <= incident.startedDay).map((message) => message.id)
      : [],
    pathSummary,
    helped: helped.slice(0, 6),
    hurt: hurt.slice(0, 6),
    relatedDecisionIds: [...new Set([...priorChoices.map((choice) => choice.decisionId), ...relatedDecisions])],
    relatedAssumptionIds: relatedAssumptions,
    narrative,
  }
}

/** Every warning this campaign raised came when a hunt could not be commissioned. */
function warningsUnhuntable(state: GameState, campaignId: string | undefined): boolean {
  if (!campaignId) return false
  const raised = Object.keys(state.flags).filter((flag) => flag.startsWith(`signal.${campaignId}.`))
  return raised.length > 0 && raised.every((flag) => state.flags[`unhuntable.${flag.slice('signal.'.length)}`] === true)
}
