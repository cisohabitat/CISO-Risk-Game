/**
 * The single effect reducer (plan §38).
 *
 * Content and player actions describe *what should change* as data; this file
 * is the only place that knows *how* to change it. Anything that bypasses this
 * reducer is an architectural regression.
 */
import type { ContentIndex, GameEffect, GameState } from '../types'
import { CYBER_FUNCTIONS, clamp01 } from '../types'
import { revealEdge, revealEvidence, revealNode } from '../knowledge/discovery'
import { openDecision } from '../decisions/open'
import { createIncident } from '../incidents/create'
import { pushMessage } from '../inbox/messages'
import { evaluateAssumption } from '../assumptions/validation'
import type { Rng } from './rng'

export interface EffectContext {
  index: ContentIndex
  rng: Rng
  /** Where this batch of effects came from, for the history trail. */
  source: string
  /** Set when effects are applied as part of resolving a decision. */
  decisionId?: string
}

export interface EffectOutcome {
  /** Short player-facing notes worth surfacing, e.g. in the day summary. */
  notes: string[]
  /** Effects that should pause the clock once applied. */
  interrupts: string[]
}

export function applyEffects(
  state: GameState,
  effects: readonly GameEffect[],
  context: EffectContext,
): EffectOutcome {
  const outcome: EffectOutcome = { notes: [], interrupts: [] }
  for (const effect of effects) applyEffect(state, effect, context, outcome)
  return outcome
}

function stakeholder(state: GameState, id: string) {
  return state.stakeholders.stakeholders[id]
}

function control(state: GameState, id: string) {
  return state.controls.controls[id]
}

export function applyEffect(
  state: GameState,
  effect: GameEffect,
  context: EffectContext,
  outcome: EffectOutcome,
): void {
  const { index } = context
  switch (effect.type) {
    case 'budget.change': {
      state.resources.budgetRemaining = round2(state.resources.budgetRemaining + effect.amount)
      if (effect.note) outcome.notes.push(effect.note)
      break
    }
    case 'focus.change': {
      state.resources.focusRemaining = Math.max(0, state.resources.focusRemaining + effect.amount)
      break
    }
    case 'capacity.change': {
      const fn = state.team.functions[effect.fn]
      if (fn) fn.capacity = Math.max(0, round2(fn.capacity + effect.delta))
      break
    }
    case 'stakeholder.trust': {
      const person = stakeholder(state, effect.stakeholderId)
      if (!person) break
      person.trust = clamp01(person.trust + effect.delta)
      if (effect.reason) {
        person.memory.unshift({
          day: state.currentDay,
          summary: effect.reason,
          sentiment: effect.delta >= 0.02 ? 'positive' : effect.delta <= -0.02 ? 'negative' : 'neutral',
        })
        person.memory = person.memory.slice(0, 24)
      }
      break
    }
    case 'stakeholder.concern': {
      const person = stakeholder(state, effect.stakeholderId)
      if (person && !person.concerns.includes(effect.concern)) person.concerns.unshift(effect.concern)
      if (person) person.concerns = person.concerns.slice(0, 6)
      break
    }
    case 'stakeholder.understanding': {
      const person = stakeholder(state, effect.stakeholderId)
      if (person) person.cyberUnderstanding = clamp01(person.cyberUnderstanding + effect.delta)
      break
    }
    case 'control.coverage': {
      const c = control(state, effect.controlId)
      if (c) c.coverage = clamp01(c.coverage + effect.delta)
      break
    }
    case 'control.configuration': {
      const c = control(state, effect.controlId)
      if (c) c.configurationQuality = clamp01(c.configurationQuality + effect.delta)
      break
    }
    case 'control.operational': {
      const c = control(state, effect.controlId)
      if (c) c.operationalEffectiveness = clamp01(c.operationalEffectiveness + effect.delta)
      break
    }
    case 'control.monitoring': {
      const c = control(state, effect.controlId)
      if (c) c.monitoringQuality = clamp01(c.monitoringQuality + effect.delta)
      break
    }
    case 'control.exceptions': {
      const c = control(state, effect.controlId)
      if (c) c.exceptionRate = clamp01(c.exceptionRate + effect.delta)
      break
    }
    case 'control.assess': {
      const c = control(state, effect.controlId)
      if (!c) break
      // Assurance replaces belief with truth as at today.
      c.believed = {
        coverage: c.coverage,
        configurationQuality: c.configurationQuality,
        operationalEffectiveness: c.operationalEffectiveness,
        monitoringQuality: c.monitoringQuality,
        exceptionRate: c.exceptionRate,
        assessedOnDay: state.currentDay,
      }
      break
    }
    case 'programme.progress': {
      const programme = state.programmes.programmes[effect.programmeId]
      if (programme) programme.progress = clamp01(programme.progress + effect.delta)
      break
    }
    case 'programme.status': {
      const programme = state.programmes.programmes[effect.programmeId]
      if (!programme) break
      programme.status = effect.status
      if (effect.status === 'active' && programme.startedDay === undefined) programme.startedDay = state.currentDay
      if (effect.status === 'complete') programme.completedDay = state.currentDay
      break
    }
    case 'programme.blocker': {
      const programme = state.programmes.programmes[effect.programmeId]
      if (!programme) break
      if (!programme.blockers.some((b) => b.id === effect.blockerId && !b.resolved)) {
        programme.blockers.push({ id: effect.blockerId, startedDay: state.currentDay, resolved: false })
        if (programme.status === 'active') programme.status = 'at-risk'
      }
      break
    }
    case 'programme.resolveBlocker': {
      const programme = state.programmes.programmes[effect.programmeId]
      if (!programme) break
      for (const blocker of programme.blockers) {
        if (blocker.id === effect.blockerId) blocker.resolved = true
      }
      if (programme.status === 'at-risk' && programme.blockers.every((b) => b.resolved)) programme.status = 'active'
      break
    }
    case 'programme.sponsor': {
      const programme = state.programmes.programmes[effect.programmeId]
      if (programme) programme.sponsorId = effect.stakeholderId
      break
    }
    case 'evidence.reveal': {
      if (revealEvidence(state, index, effect.evidenceId, effect.note ?? context.source)) {
        const def = index.evidence.get(effect.evidenceId)
        if (def) outcome.notes.push(def.title)
      }
      break
    }
    case 'node.reveal': {
      revealNode(state, effect.nodeId, effect.confidence ?? 0.8)
      break
    }
    case 'edge.reveal': {
      revealEdge(state, index, effect.edgeId)
      break
    }
    case 'node.exposure': {
      const node = state.organisation.nodes[effect.nodeId]
      if (node) node.exposure = clamp01(node.exposure + effect.delta)
      break
    }
    case 'node.weakness': {
      const node = state.organisation.nodes[effect.nodeId]
      if (node) node.weakness = clamp01(node.weakness + effect.delta)
      break
    }
    case 'assumption.record': {
      recordAssumption(state, context, effect.assumptionId, effect.decisionId ?? context.decisionId)
      break
    }
    case 'assumption.invalidate': {
      for (const assumption of Object.values(state.assumptions.assumptions)) {
        if (assumption.defId !== effect.assumptionId || assumption.status === 'invalidated') continue
        assumption.status = 'invalidated'
        assumption.invalidatedDay = state.currentDay
        assumption.invalidationReason = effect.reason ?? 'The world moved on.'
        outcome.interrupts.push('assumption-invalidated')
      }
      break
    }
    case 'event.schedule': {
      state.events.scheduled.push({ eventId: effect.eventId, day: state.currentDay + effect.dayOffset })
      break
    }
    case 'event.suppress': {
      if (!state.events.suppressedEventIds.includes(effect.eventId)) {
        state.events.suppressedEventIds.push(effect.eventId)
      }
      break
    }
    case 'threat.pressure': {
      const actor = state.threats.actors[effect.actorId]
      if (actor) actor.pressure = clamp01(actor.pressure + effect.delta)
      break
    }
    case 'threat.interest': {
      const actor = state.threats.actors[effect.actorId]
      if (actor) actor.interest = clamp01(actor.interest + effect.delta)
      break
    }
    case 'threat.setback': {
      const actor = state.threats.actors[effect.actorId]
      if (actor) actor.setbackUntilDay = state.currentDay + Math.max(1, effect.stages) * 14
      for (const campaign of state.threats.campaigns) {
        if (campaign.actorId !== effect.actorId || campaign.disrupted || campaign.incidentId) continue
        campaign.stepIndex = Math.max(0, campaign.stepIndex - effect.stages)
        campaign.stepProgress = 0
        if (campaign.stepIndex === 0) {
          campaign.disrupted = true
          campaign.disruptedDay = state.currentDay
        }
      }
      if (effect.note) outcome.notes.push(effect.note)
      break
    }
    case 'objective.progress': {
      const objective = state.business.objectives[effect.objectiveId]
      if (!objective) break
      objective.progress = clamp01(objective.progress + effect.delta)
      // Security actively helping an objective makes it measurably easier to
      // deliver, and the annual review reports it.
      if (effect.delta > 0) objective.securitySupported = true
      break
    }
    case 'objective.delay': {
      const objective = state.business.objectives[effect.objectiveId]
      const def = index.objective.get(effect.objectiveId)
      if (!objective || !def) break
      // A delay costs delivery, it does not move the commitment: the date the
      // business promised the market stays where it was.
      objective.delayDays += effect.days
      const span = Math.max(30, def.targetDay - Math.round(def.targetDay * 0.12))
      objective.progress = clamp01(objective.progress - effect.days / span)
      break
    }
    case 'objective.status': {
      const objective = state.business.objectives[effect.objectiveId]
      if (objective) objective.status = effect.status
      break
    }
    case 'risk.open': {
      const scenario = state.risks.scenarios[effect.scenarioId]
      const def = index.riskScenario.get(effect.scenarioId)
      if (!def) break
      if (scenario) {
        if (scenario.status === 'emerging') scenario.status = 'open'
        break
      }
      state.risks.scenarios[effect.scenarioId] = {
        id: effect.scenarioId,
        openedDay: state.currentDay,
        status: 'open',
        confidence: 'limited',
        ownerStakeholderId: def.ownerStakeholderId,
        decisionIds: [],
        assumptionIds: [],
        nextReviewDay: state.currentDay + 60,
        lastAssessed: null,
        escalatedToBoard: false,
        notes: [],
      }
      break
    }
    case 'risk.status': {
      const scenario = state.risks.scenarios[effect.scenarioId]
      if (scenario) scenario.status = effect.status
      break
    }
    case 'risk.review': {
      const scenario = state.risks.scenarios[effect.scenarioId]
      if (scenario) scenario.nextReviewDay = state.currentDay + effect.dayOffset
      break
    }
    case 'team.morale': {
      if (effect.fn) {
        const fn = state.team.functions[effect.fn]
        if (fn) fn.morale = clamp01(fn.morale + effect.delta)
      } else {
        for (const fn of CYBER_FUNCTIONS) {
          const runtime = state.team.functions[fn]
          if (runtime) runtime.morale = clamp01(runtime.morale + effect.delta)
        }
      }
      break
    }
    case 'team.workload': {
      const fn = state.team.functions[effect.fn]
      if (fn) fn.committed = Math.max(0, fn.committed + effect.delta)
      break
    }
    case 'leader.morale': {
      const leader = state.team.leaders[effect.leaderId]
      if (leader) leader.morale = clamp01(leader.morale + effect.delta)
      break
    }
    case 'leader.confidence': {
      const leader = state.team.leaders[effect.leaderId]
      if (leader) leader.reliability = clamp01(leader.reliability + effect.delta)
      break
    }
    case 'team.vacancyFilled': {
      const fn = state.team.functions[effect.fn]
      if (fn && fn.vacancies > 0) {
        fn.vacancies -= 1
        fn.capacity = round2(fn.capacity + 1)
      }
      break
    }
    case 'incident.start': {
      const incident = createIncident(state, index, {
        familyId: effect.familyId,
        pathId: effect.pathId,
        actorId: effect.actorId,
      })
      if (incident) outcome.interrupts.push('incident')
      break
    }
    case 'incident.containment': {
      const incident = currentIncident(state)
      if (incident) incident.containment = clamp01(incident.containment + effect.delta)
      break
    }
    case 'incident.recovery': {
      const incident = currentIncident(state)
      if (incident) incident.recovery = clamp01(incident.recovery + effect.delta)
      break
    }
    case 'incident.consequence': {
      const incident = currentIncident(state)
      if (incident) incident.consequence = clamp01(incident.consequence + effect.delta)
      break
    }
    case 'flag.set': {
      state.flags[effect.flag] = effect.value ?? true
      break
    }
    case 'flag.increment': {
      const current = state.flags[effect.flag]
      state.flags[effect.flag] = (typeof current === 'number' ? current : 0) + effect.amount
      break
    }
    case 'inbox.message': {
      // Reserved for authored standalone notes; the event engine normally
      // creates inbox traffic directly from event definitions.
      const def = index.event.get(effect.messageId)
      if (def) {
        pushMessage(state, {
          from: def.from,
          subject: def.title,
          body: def.body,
          type: def.type,
          priority: def.priority,
          relatedNodeIds: def.relatedNodeIds,
          eventId: def.id,
        })
      }
      break
    }
    case 'history.note': {
      state.history.entries.push({ day: state.currentDay, kind: effect.kind, summary: effect.summary })
      break
    }
    case 'decision.open': {
      const decision = openDecision(state, index, effect.decisionId, { deadlineDays: effect.deadlineDays })
      if (decision) outcome.interrupts.push('decision-deadline')
      break
    }
    case 'board.confidence': {
      state.stakeholders.boardConfidence = clamp01(state.stakeholders.boardConfidence + effect.delta)
      break
    }
    case 'operationalTolerance': {
      state.stakeholders.operationalTolerance = clamp01(state.stakeholders.operationalTolerance + effect.delta)
      break
    }
    default: {
      const exhaustive: never = effect
      void exhaustive
    }
  }
}

function currentIncident(state: GameState) {
  const id = state.incidents.activeId
  if (!id) return undefined
  const incident = state.incidents.incidents[id]
  return incident && incident.phase !== 'closed' ? incident : undefined
}

export function recordAssumption(
  state: GameState,
  context: EffectContext,
  defId: string,
  decisionId?: string,
  scenarioId?: string,
): string | undefined {
  const def = context.index.assumption.get(defId)
  if (!def) return undefined
  const existing = Object.values(state.assumptions.assumptions).find(
    (a) => a.defId === defId && a.status !== 'invalidated',
  )
  if (existing) {
    if (decisionId && !existing.linkedDecisionId) existing.linkedDecisionId = decisionId
    if (scenarioId && !existing.linkedScenarioIds.includes(scenarioId)) existing.linkedScenarioIds.push(scenarioId)
    return existing.id
  }
  state.assumptions.counter += 1
  const id = `asm-${state.assumptions.counter}`
  state.assumptions.assumptions[id] = {
    id,
    defId,
    statement: def.statement,
    createdDay: state.currentDay,
    linkedDecisionId: decisionId,
    linkedScenarioIds: scenarioId ? [scenarioId] : [],
    linkedNodeIds: def.linkedNodeIds,
    status: 'valid',
    // Checked once, here, against the truth. The player is told nothing now:
    // if this is false they find out when they go and look.
    heldWhenRecorded: evaluateAssumption(state, context.index, def.validationRuleId)?.holds ?? true,
    nextReviewDay: state.currentDay + def.reviewAfterDays,
    acknowledged: false,
  }
  return id
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
