/**
 * The daily tick (plan §39).
 *
 * The order below is load-bearing and covered by a test: subsystems read each
 * other's output within a day, so reordering silently changes the simulation.
 * One tick = one in-game day. There is no real-time loop anywhere in the game.
 */
import type { ContentIndex, GameEffect, GameState, PauseReason } from '../types'
import { CAMPAIGN_DAYS, DAYS_PER_QUARTER, DAYS_PER_WEEK, clamp01 } from '../types'
import { createRng } from './rng'
import { applyEffects } from './effects'
import { applyDrift } from '../controls/effectiveness'
import { maintainedControlIds, tickProgrammes } from '../programmes/progression'
import { recoverServiceHealth, tickObjectives } from '../business/objectives'
import { tickAssignments } from '../team/assignments'
import { refreshCommittedCapacity, updateTeamWellbeing } from '../team/capacity'
import { tickRelationships } from '../stakeholders/relationships'
import { tickAssumptions } from '../assumptions/validation'
import { driftSectorPressure, tickThreats } from '../threats/engine'
import { tickIncidents } from '../incidents/engine'
import { tickEvents } from '../events/engine'
import { openDecision } from '../decisions/open'
import { pushMessage } from '../inbox/messages'
import { recomputeUnderstanding } from '../knowledge/discovery'
import { refreshHypothesisConfidence, refreshScenarioAssessments } from '../risk/review'
import { createIncident } from '../incidents/create'

export interface TickResult {
  day: number
  pauseReasons: PauseReason[]
  /** Short lines for the day's briefing. */
  highlights: string[]
  shouldAutosave: boolean
  quarterEnded?: number
  yearEnded?: boolean
}

export const TICK_ORDER = [
  'advance-date',
  'refresh-resources',
  'apply-pending-effects',
  'business-objectives',
  'cyber-programmes',
  'delegated-work',
  'team-wellbeing',
  'stakeholders',
  'assumptions',
  'threat-pressure',
  'attack-paths',
  'incidents',
  'events',
  'inbox',
  'derived-risk',
  'auto-pause',
  'autosave',
] as const

export function tickDay(state: GameState, index: ContentIndex): TickResult {
  const rng = createRng(state.seed, state.rngCursor)
  const highlights: string[] = []
  const pauseReasons = new Set<PauseReason>()
  const queued: GameEffect[] = []

  // 1. Advance the date.
  state.currentDay += 1
  const day = state.currentDay

  // 2. Weekly/quarterly resource boundaries.
  let quarterEnded: number | undefined
  if (day % DAYS_PER_WEEK === 0) {
    state.resources.weekIndex += 1
    state.resources.focusRemaining = state.resources.focusPerWeek
  }
  if (day % DAYS_PER_QUARTER === 0 && day < CAMPAIGN_DAYS) {
    quarterEnded = Math.floor(day / DAYS_PER_QUARTER)
    state.reviews.pendingQuarter = quarterEnded
    pauseReasons.add('quarter-end')
  }

  // 3. Delayed consequences scheduled by earlier decisions.
  const duePending = state.pendingEffects.filter((entry) => entry.day <= day)
  if (duePending.length > 0) {
    state.pendingEffects = state.pendingEffects.filter((entry) => entry.day > day)
    for (const entry of duePending) {
      const outcome = applyEffects(state, entry.effects, { index, rng, source: entry.source })
      if (entry.note) highlights.push(entry.note)
      for (const interrupt of outcome.interrupts) pauseReasons.add(interrupt as PauseReason)
    }
  }

  // 4. Business objectives move whether or not security is watching.
  const objectiveResult = tickObjectives(state, index)
  for (const id of objectiveResult.achieved) {
    const def = index.objective.get(id)
    if (def) highlights.push(`${def.name} delivered.`)
  }
  for (const id of objectiveResult.atRisk) {
    const def = index.objective.get(id)
    if (def) highlights.push(`${def.name} is slipping.`)
  }
  recoverServiceHealth(state, index)

  // 5. Cyber programmes.
  const programmeResult = tickProgrammes(state, index, rng)
  queued.push(...programmeResult.effects)
  for (const milestone of programmeResult.milestones) {
    const programme = index.programme.get(milestone.programmeId)
    highlights.push(`${programme?.shortName ?? milestone.programmeId}: ${milestone.name} reached.`)
  }
  for (const blocker of programmeResult.newBlockers) {
    const programme = index.programme.get(blocker.programmeId)
    highlights.push(`${programme?.shortName ?? blocker.programmeId} has hit a blocker: ${blocker.name}.`)
    pushMessage(state, {
      from: programme?.name ?? 'Programme office',
      subject: `Blocker: ${blocker.name}`,
      body: blocker.description,
      type: 'programme',
      priority: 'notable',
    })
  }

  // 6. Delegated work returns.
  const assignmentResult = tickAssignments(state, index, rng)
  queued.push(...assignmentResult.effects)
  for (const completed of assignmentResult.completed) {
    const leader = index.leader.get(completed.leaderId)
    pushMessage(state, {
      from: leader?.name ?? 'Cyber team',
      subject: `Completed: ${completed.title}`,
      body: completed.summary,
      type: 'discovery',
      priority: 'notable',
    })
    highlights.push(`${completed.title} came back.`)
  }
  for (const delayed of assignmentResult.delayed) {
    highlights.push(`${delayed.title} has slipped by ${delayed.days} day${delayed.days === 1 ? '' : 's'}.`)
  }

  // 7. Team workload and morale. Committed capacity is recomputed first, from
  // the work that actually exists, so strain reflects assignments and live
  // programmes competing for the same people.
  refreshCommittedCapacity(state, index)
  updateTeamWellbeing(state)

  // 8. Stakeholders.
  tickRelationships(state)

  // 9. Assumptions. Invalidation forces reassessment and stops the clock.
  const assumptionResult = tickAssumptions(state, index)
  for (const invalidated of assumptionResult.invalidated) {
    pauseReasons.add('assumption-invalidated')
    highlights.push(
      invalidated.wasNeverTrue
        ? `An assumption you relied on was never true: ${invalidated.statement}`
        : `Assumption no longer holds: ${invalidated.statement}`,
    )
    pushMessage(state, {
      from: 'Cyber risk',
      // The two cases teach different lessons, so they are never worded alike.
      subject: invalidated.wasNeverTrue
        ? 'Something you relied on was never the case'
        : 'An assumption behind a past decision no longer holds',
      body: invalidated.wasNeverTrue
        ? `${invalidated.statement}\n\n${invalidated.reason}\n\nNothing has changed. We simply had not checked, and the decisions that rested on it were taken on a belief rather than on evidence. They need revisiting.`
        : `${invalidated.statement}\n\n${invalidated.reason}\n\nThe decisions and risks that relied on it need reassessment.`,
      type: 'assumption',
      priority: 'urgent',
      pinned: true,
    })
  }

  // 10. Threat pressure and 11. attack path progression.
  driftSectorPressure(state, rng)
  const threatResult = tickThreats(state, index, rng)
  for (const signal of threatResult.signals) {
    const node = index.node.get(signal.nodeId)
    const alreadyReported = state.flags[`signal.${signal.campaignId}.${signal.stage}`]
    if (alreadyReported) continue
    state.flags[`signal.${signal.campaignId}.${signal.stage}`] = true
    pushMessage(state, {
      from: 'SOC (managed service)',
      subject: signal.strength === 'clear' ? 'Confirmed suspicious activity' : 'Low-confidence anomaly',
      body:
        signal.strength === 'clear'
          ? `Analysts have confirmed unexplained activity associated with ${node?.name ?? 'an internal system'}. It does not match known administrative behaviour.`
          : `A weak signal has been raised around ${node?.name ?? 'an internal system'}. The analyst notes it may be benign; telemetry coverage here is partial.`,
      type: 'threat',
      priority: signal.strength === 'clear' ? 'urgent' : 'routine',
      relatedNodeIds: [signal.nodeId],
    })
    if (signal.strength === 'clear') highlights.push('The SOC has confirmed suspicious activity.')
  }
  for (const campaignId of threatResult.disrupted) {
    const campaign = state.threats.campaigns.find((c) => c.id === campaignId)
    if (campaign?.detected) {
      highlights.push('Suspicious activity has stopped after intervention.')
    }
  }
  for (const breach of threatResult.breaches) {
    const campaign = state.threats.campaigns.find((c) => c.id === breach.campaignId)
    const incident = createIncident(state, index, {
      familyId: breach.familyId,
      campaign,
      actorId: breach.actorId,
      pathId: breach.pathId,
      detected: campaign?.detected ?? false,
    })
    if (incident) {
      pauseReasons.add('incident')
      highlights.push('An incident has begun.')
    }
  }
  queued.push(...threatResult.effects)

  // 12. Incidents progress.
  const incidentResult = tickIncidents(state, index, rng)
  queued.push(...incidentResult.effects)
  for (const transition of incidentResult.transitions) {
    highlights.push(transition.note)
    const incident = state.incidents.incidents[transition.incidentId]
    const family = incident ? index.incidentFamily.get(incident.familyId) : undefined
    pushMessage(state, {
      from: 'Incident response',
      subject: `${family?.name ?? 'Incident'}: ${transition.phase}`,
      body: transition.note,
      type: 'incident',
      priority: transition.phase === 'closed' ? 'notable' : 'critical',
      pinned: transition.phase !== 'closed',
    })
  }
  for (const { decisionId } of incidentResult.openDecisionIds) {
    const decision = openDecision(state, index, decisionId, { deadlineDays: 2 })
    if (decision) {
      const def = index.decision.get(decisionId)
      pushMessage(state, {
        from: 'Incident response',
        subject: def?.title ?? 'Response decision required',
        body: def?.description ?? '',
        type: 'incident',
        priority: 'critical',
        decisionId: decision.id,
        pinned: true,
      })
    }
  }
  if (incidentResult.interrupts) pauseReasons.add('incident')

  // 13. Conditional events, and 14. the inbox traffic they generate.
  const eventResult = tickEvents(state, index, rng)
  for (const fired of eventResult.fired) {
    const outcome = applyEffects(state, fired.effects, { index, rng, source: `event:${fired.def.id}` })
    for (const interrupt of outcome.interrupts) pauseReasons.add(interrupt as PauseReason)

    let decisionRuntimeId: string | undefined
    if (fired.def.decisionId) {
      const decision = openDecision(state, index, fired.def.decisionId, { eventId: fired.def.id })
      decisionRuntimeId = decision?.id
      if (decision) pauseReasons.add('decision-deadline')
    }
    pushMessage(state, {
      from: fired.def.from,
      subject: fired.def.title,
      body: fired.def.body,
      type: fired.def.type,
      priority: fired.def.priority,
      decisionId: decisionRuntimeId,
      relatedNodeIds: fired.def.relatedNodeIds,
      eventId: fired.def.id,
      pinned: fired.def.priority === 'critical',
    })
    if (fired.def.priority === 'urgent' || fired.def.priority === 'critical') {
      highlights.push(fired.def.title)
    }
  }

  // Apply everything queued by subsystems through the one reducer.
  if (queued.length > 0) {
    const outcome = applyEffects(state, queued, { index, rng, source: 'tick' })
    for (const interrupt of outcome.interrupts) pauseReasons.add(interrupt as PauseReason)
  }

  // Control drift: unmaintained controls decay.
  const maintained = maintainedControlIds(state, index)
  for (const def of index.content.controls) {
    const runtime = state.controls.controls[def.id]
    if (runtime) applyDrift(runtime, def, maintained.has(def.id))
  }

  // 15. Derived risk information.
  recomputeUnderstanding(state, index)
  const reviewResult = refreshScenarioAssessments(state, index)
  refreshHypothesisConfidence(state)
  for (const worse of reviewResult.materiallyWorse) {
    const def = index.riskScenario.get(worse.scenarioId)
    if (def) highlights.push(`${def.title} has moved materially.`)
  }
  // A temporary acceptance that has run out is a decision arising from the
  // player's own position: renew it on the same assumptions, look again, or
  // let it sit. Opened here rather than by an event so it lands when the
  // period the player chose ends, which for a Q1 acceptance is the back half
  // of the year. One at a time: a second expiry while one is open waits for
  // its own review day rather than stacking.
  for (const scenarioId of reviewResult.expiredAcceptances) {
    const def = index.riskScenario.get(scenarioId)
    if (!def) continue
    const alreadyOpen = state.decisions.openIds.some((id) => state.decisions.decisions[id]?.defId === 'dec-acceptance-renewal')
    if (!alreadyOpen && index.decision.get('dec-acceptance-renewal')) {
      openDecision(state, index, 'dec-acceptance-renewal', { scenarioId, deadlineDays: 14 })
      pauseReasons.add('decision-deadline')
    }
    pushMessage(state, {
      from: 'Nexora Group',
      subject: `Your acceptance of ${def.title} has run out`,
      body: `You accepted it on a stated rationale and a set of assumptions. The period you gave it has ended; it is back on the register as open until you decide again.`,
      type: 'assumption',
      priority: 'urgent',
    })
    state.history.entries.push({
      day: state.currentDay,
      kind: 'acceptance-expired',
      summary: `The acceptance of ${def.title} ran out.`,
      refs: [scenarioId],
    })
  }

  // Decision deadlines: an unanswered decision resolves itself, badly.
  for (const decisionId of [...state.decisions.openIds]) {
    const decision = state.decisions.decisions[decisionId]
    if (!decision?.deadlineDay) continue
    if (day < decision.deadlineDay) {
      if (day === decision.deadlineDay - 1) pauseReasons.add('decision-deadline')
      continue
    }
    resolveByDefault(state, index, decisionId, rng)
    highlights.push('A decision was taken out of your hands by the deadline passing.')
  }

  // 16. Auto-pause and bookkeeping.
  if (day % DAYS_PER_WEEK === 0) {
    state.history.weekly.push({
      day,
      residualExposure: averageResidual(state),
      boardConfidence: state.stakeholders.boardConfidence,
      teamStrain: averageStrain(state),
      budgetRemaining: state.resources.budgetRemaining,
      programmeProgress: averageProgrammeProgress(state),
      threatPressure: state.threats.sectorPressure,
    })
    if (state.history.weekly.length > 80) state.history.weekly.shift()
  }
  if (state.history.entries.length > 600) {
    state.history.entries = state.history.entries.slice(-500)
  }

  let yearEnded = false
  if (day >= CAMPAIGN_DAYS) {
    yearEnded = true
    state.finished = true
    pauseReasons.add('year-end')
  }

  state.rngCursor = rng.cursor
  const reasons = [...pauseReasons]
  if (reasons.length > 0) {
    state.paused = true
    state.speed = 'paused'
    state.pauseReasons = reasons
  } else {
    state.pauseReasons = []
  }

  return {
    day,
    pauseReasons: reasons,
    highlights: highlights.slice(0, 12),
    shouldAutosave: day % 7 === 0 || reasons.length > 0,
    quarterEnded,
    yearEnded,
  }
}

/** A decision left to expire takes the authored default, with a trust cost. */
function resolveByDefault(
  state: GameState,
  index: ContentIndex,
  decisionId: string,
  rng: ReturnType<typeof createRng>,
): void {
  const decision = state.decisions.decisions[decisionId]
  if (!decision) return
  const def = index.decision.get(decision.defId)
  if (!def) return
  const option = def.options.find((o) => o.id === def.defaultOptionId) ?? def.options[0]
  if (!option) return

  decision.selectedOptionId = option.id
  decision.resolvedDay = state.currentDay
  decision.resolvedByDefault = true
  state.decisions.openIds = state.decisions.openIds.filter((id) => id !== decisionId)
  state.decisions.resolvedIds.push(decisionId)

  applyEffects(state, option.immediateEffects, {
    index,
    rng,
    source: `decision-default:${def.id}`,
    decisionId,
  })
  for (const delayed of option.delayedEffects ?? []) {
    state.pendingEffects.push({
      id: `pending-${decisionId}-${delayed.dayOffset}`,
      day: state.currentDay + delayed.dayOffset,
      effects: delayed.effects,
      note: delayed.note,
      source: `decision:${def.id}`,
    })
  }
  state.history.decisionsLog.push({
    day: state.currentDay,
    decisionId,
    optionId: option.id,
    rationaleTagIds: [],
  })
  state.history.entries.push({
    day: state.currentDay,
    kind: 'decision-lapsed',
    summary: `${def.title} lapsed; the organisation defaulted to "${option.label}".`,
    refs: [decisionId],
  })

  // Tell the player, in the channel everything else arrives through. This was
  // a history line and nothing more: it appeared in the Briefing's four-item
  // "Recently" list and rolled off within days, so a player who missed a
  // deadline learned what the organisation had chosen for them on 31 December,
  // when the review counted it against them. A consequential thing with your
  // name on it is a message, not a footnote.
  pushMessage(state, {
    from: 'Nexora Group',
    subject: `Decided without you: ${def.title}`,
    body: `The deadline passed with no answer from you, so the organisation went with "${option.label}". ${option.description} It is recorded as your decision by default, and the annual review will read it that way.`,
    type: 'executive',
    priority: 'urgent',
    decisionId,
  })
}

function averageResidual(state: GameState): number {
  const values = Object.values(state.risks.scenarios)
    .map((s) => s.lastAssessed?.residual)
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return 0
  return clamp01(values.reduce((sum, v) => sum + v, 0) / values.length)
}

function averageStrain(state: GameState): number {
  let committed = 0
  let capacity = 0
  for (const fn of Object.values(state.team.functions)) {
    committed += fn.committed
    capacity += fn.capacity
  }
  return capacity > 0 ? clamp01(committed / capacity) : 0
}

function averageProgrammeProgress(state: GameState): number {
  const values = Object.values(state.programmes.programmes)
    .filter((p) => p.status !== 'proposed')
    .map((p) => p.progress)
  if (values.length === 0) return 0
  return clamp01(values.reduce((sum, v) => sum + v, 0) / values.length)
}
