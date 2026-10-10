/**
 * Evaluates the declarative condition vocabulary against game state.
 * Pure and total: an unknown reference evaluates to false rather than throwing,
 * and `pnpm validate:content` catches dangling ids before they ship.
 */
import type { CampaignStage, Condition, ContentIndex, GameState } from '../types'
import { CAMPAIGN_STAGES, clamp01 } from '../types'
import { calculateControlEffectiveness } from '../controls/effectiveness'
import { hiringUnderWay, teamStrain } from '../team/capacity'
import { unreportedScenarios } from '../risk/unreported'

export function evaluateCondition(state: GameState, index: ContentIndex, condition: Condition): boolean {
  switch (condition.kind) {
    case 'always':
      return true
    case 'day.after':
      return state.currentDay >= condition.day
    case 'day.before':
      return state.currentDay < condition.day
    case 'flag.set':
      return Boolean(state.flags[condition.flag])
    case 'flag.notSet':
      return !state.flags[condition.flag]
    case 'flag.atLeast': {
      const raw = state.flags[condition.flag]
      return typeof raw === 'number' && raw >= condition.value
    }
    case 'node.discovered':
      return Boolean(state.organisation.nodes[condition.nodeId]?.discovered)
    case 'node.notDiscovered':
      return !state.organisation.nodes[condition.nodeId]?.discovered
    case 'edge.exists':
      return Boolean(state.organisation.edges[condition.edgeId]?.exists)
    case 'edge.discovered': {
      const edge = state.organisation.edges[condition.edgeId]
      return Boolean(edge?.exists && edge.discovered)
    }
    case 'control.coverageBelow': {
      const control = state.controls.controls[condition.controlId]
      return control ? control.coverage < condition.value : false
    }
    case 'control.coverageAtLeast': {
      const control = state.controls.controls[condition.controlId]
      return control ? control.coverage >= condition.value : false
    }
    case 'control.effectivenessBelow': {
      const control = state.controls.controls[condition.controlId]
      return control ? calculateControlEffectiveness(control) < condition.value : false
    }
    case 'programme.status':
      return state.programmes.programmes[condition.programmeId]?.status === condition.status
    case 'programme.progressAtLeast': {
      const programme = state.programmes.programmes[condition.programmeId]
      return programme ? programme.progress >= condition.value : false
    }
    case 'programme.anyActive':
      return Object.values(state.programmes.programmes).some((p) => p.status === 'active' || p.status === 'at-risk')
    // "A programme has stalled" and "a programme is ahead of plan" both fired
    // on anyActive and claimed a state nobody checked: measured over 20
    // campaigns, the stall was real in 27 of 93 arrivals and the win in 0 of
    // 54. A message that claims a state has to test for it.
    // The reminder waits a week: it arrived on the same day as the
    // programme's own blocker message and said the same thing less exactly.
    case 'programme.anyBlocked':
      return Object.values(state.programmes.programmes).some(
        (p) =>
          (p.status === 'active' || p.status === 'at-risk') &&
          p.blockers.some((b) => !b.resolved && state.currentDay - b.startedDay >= (condition.forDays ?? 0)),
      )
    // "Ahead of plan" was the first wording, and a programme is never ahead:
    // over 6,291 live-programme days the largest lead over the linear plan
    // was 0.000. On plan, with nothing blocking, is a state that happens.
    case 'programme.anyOnPlan':
      return Object.values(state.programmes.programmes).some((p) => {
        if (p.status !== 'active' || p.startedDay === undefined) return false
        // A programme a day old is trivially on plan; "on plan for once" is
        // a claim about a track record, so a month of it is the least it means.
        const elapsed = state.currentDay - p.startedDay
        if (elapsed < 30) return false
        const def = index.programme.get(p.id)
        if (!def) return false
        const expected = elapsed / Math.max(1, def.durationDays)
        // Within a tenth of plan, not within two points of it. A programme
        // with no blockers and nothing competing for its team still runs at
        // about 92% of the nominal rate, measured, so an absolute 0.02 made
        // "a programme is on plan" a message the game could never send.
        return p.progress >= expected * 0.9 && p.blockers.every((b) => b.resolved)
      })
    // "Several assumptions are past their review date" fired with none
    // recorded, and "both identity roles are still open" fired after the
    // player had recruited. A message that claims a state tests for it.
    case 'assumption.anyRecorded':
      return Object.values(state.assumptions.assumptions).some((a) => a.status !== 'invalidated')
    case 'team.vacancyOpen':
      return Object.entries(state.team.functions).some(([id, fn]) => fn.vacancies > 0 && !hiringUnderWay(state, id))
    case 'stakeholder.trustBelow': {
      const stakeholder = state.stakeholders.stakeholders[condition.stakeholderId]
      return stakeholder ? stakeholder.trust < condition.value : false
    }
    case 'stakeholder.trustAtLeast': {
      const stakeholder = state.stakeholders.stakeholders[condition.stakeholderId]
      return stakeholder ? stakeholder.trust >= condition.value : false
    }
    case 'threat.pressureAtLeast': {
      const actor = state.threats.actors[condition.actorId]
      return actor ? actor.pressure >= condition.value : false
    }
    case 'threat.campaignActive':
      return state.threats.campaigns.some(
        (c) => !c.disrupted && !c.incidentId && (!condition.actorId || c.actorId === condition.actorId),
      )
    case 'threat.campaignStageAtLeast': {
      const target = CAMPAIGN_STAGES.indexOf(condition.stage as CampaignStage)
      if (target < 0) return false
      return state.threats.campaigns.some(
        (c) => !c.disrupted && CAMPAIGN_STAGES.indexOf(c.stage) >= target,
      )
    }
    case 'incident.active':
      return Object.values(state.incidents.incidents).some((i) => i.phase !== 'closed')
    case 'incident.none':
      return !Object.values(state.incidents.incidents).some((i) => i.phase !== 'closed')
    // "Nothing to escalate this week" arrived between urgent messages on
    // either side, because the only check was that no incident was running.
    case 'inbox.noUrgentWithin':
      return !state.inbox.messages.some(
        (m) => (m.priority === 'urgent' || m.priority === 'critical') && state.currentDay - m.day < condition.days,
      )
    case 'situation.is':
      return state.situationId === condition.situationId
    case 'incident.noneWithin':
      return !Object.values(state.incidents.incidents).some(
        (i) => i.phase !== 'closed' || state.currentDay - (i.resolvedDay ?? i.phaseEnteredDay) < condition.days,
      )
    case 'incident.resolvedCountAtLeast':
      return Object.values(state.incidents.incidents).filter((i) => i.phase === 'closed').length >= condition.value
    case 'campaign.yearAtLeast':
      return (state.year ?? 1) >= condition.year
    case 'lastYear.optionTaken':
      return state.previousYears?.at(-1)?.decisions[condition.decisionId] === condition.optionId
    case 'lastYear.dimensionBand':
      return state.previousYears?.at(-1)?.dimensions[condition.dimensionId] === condition.band
    case 'lastYear.incidentsAtLeast':
      return (state.previousYears?.at(-1)?.incidents ?? -1) >= condition.value
    case 'risk.acceptedCountAtLeast':
      return Object.values(state.risks.scenarios).filter((s) => s.status === 'accepted').length >= condition.value
    case 'evidence.known':
      return Boolean(state.evidence.items[condition.evidenceId])
    case 'evidence.tagKnown':
      return state.evidence.order.some((id) => index.evidence.get(id)?.tags.includes(condition.tag))
    case 'evidence.countAtLeast':
      return state.evidence.order.length >= condition.value
    case 'review.papersWrittenAtLeast':
      return state.reviews.quarters.filter((quarter) => quarter.completed).length >= condition.value
    case 'risk.scenarioStatus':
      return state.risks.scenarios[condition.scenarioId]?.status === condition.status
    case 'risk.openCountAtLeast':
      return Object.values(state.risks.scenarios).filter((s) => s.status === 'open' || s.status === 'treated').length >=
        condition.value
    case 'risk.unreportedAtLeast':
      return unreportedScenarios(state).length >= condition.value
    case 'assumption.invalidated':
      return Object.values(state.assumptions.assumptions).some(
        (a) => a.defId === condition.assumptionId && a.status === 'invalidated',
      )
    case 'team.capacityBandAtLeast': {
      const strain = teamStrain(state)
      const thresholds: Record<string, number> = {
        available: 0,
        committed: 0.45,
        stretched: 0.7,
        overloaded: 0.88,
        breaking: 0.97,
      }
      const threshold = thresholds[condition.band]
      return threshold === undefined ? false : strain >= threshold
    }
    case 'team.moraleBelow': {
      const values = Object.values(state.team.functions).map((f) => f.morale)
      if (values.length === 0) return false
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length
      return avg < condition.value
    }
    case 'budget.remainingBelow':
      return state.resources.budgetRemaining < condition.value
    case 'budget.remainingAtLeast':
      return state.resources.budgetRemaining >= condition.value
    case 'objective.status':
      return state.business.objectives[condition.objectiveId]?.status === condition.status
    // A choice made in an earlier year still stands. The second-year
    // reconstruction blamed "Data held longer than the retention policy
    // allowed" on a player who had enforced the policy the year before,
    // because only this year's decisions were read.
    case 'decision.optionTaken':
      return (
        Object.values(state.decisions.decisions).some(
          (d) => d.defId === condition.decisionId && d.selectedOptionId === condition.optionId,
        ) || (state.previousYears ?? []).some((year) => year.decisions[condition.decisionId] === condition.optionId)
      )
    case 'decision.resolved':
      return (
        Object.values(state.decisions.decisions).some(
          (d) => d.defId === condition.decisionId && d.resolvedDay !== undefined,
        ) || (state.previousYears ?? []).some((year) => year.decisions[condition.decisionId] !== undefined)
      )
    case 'event.fired':
      return state.events.firedEventIds.includes(condition.eventId)
    case 'event.notFired':
      return !state.events.firedEventIds.includes(condition.eventId)
    case 'not':
      return !evaluateCondition(state, index, condition.condition)
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(state, index, c))
    case 'any':
      return condition.conditions.some((c) => evaluateCondition(state, index, c))
    default: {
      const exhaustive: never = condition
      void exhaustive
      return false
    }
  }
}

export function evaluateAll(state: GameState, index: ContentIndex, conditions: Condition[]): boolean {
  for (const condition of conditions) {
    if (!evaluateCondition(state, index, condition)) return false
  }
  return true
}

/** Human-readable rendering used by the content validator and dev tools. */
export function describeCondition(condition: Condition): string {
  switch (condition.kind) {
    case 'all':
      return condition.conditions.map(describeCondition).join(' and ')
    case 'any':
      return condition.conditions.map(describeCondition).join(' or ')
    case 'not':
      return `not (${describeCondition(condition.condition)})`
    default:
      return Object.entries(condition)
        .filter(([key]) => key !== 'kind')
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(', ')
        ? `${condition.kind}(${Object.entries(condition)
            .filter(([key]) => key !== 'kind')
            .map(([key, value]) => `${key}=${String(value)}`)
            .join(', ')})`
        : condition.kind
  }
}

export const clampUnit = clamp01
