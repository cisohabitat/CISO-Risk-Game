/**
 * The orchestrator is the only entry point the application layer uses. It takes
 * a state and a player intent, validates the intent against scarce resources,
 * and returns a new state plus a short explanation.
 *
 * Everything here is pure: same state + same action = same result.
 */
import type {
  ContentIndex,
  CyberFunction,
  DecisionOptionDef,
  GameEffect,
  GameState,
  HypothesisRuntime,
  PauseReason,
} from '../types'
import { CAMPAIGN_DAYS, clamp01, money, round2 } from '../types'
import { createRng } from './rng'
import { applyEffects, recordAssumption } from './effects'
import { tickDay, type TickResult } from './tick'
export type { TickResult }
import { createInitialState, type NewGameOptions } from './setup'
import { canAfford, functionName, refreshCommittedCapacity } from '../team/capacity'
import { startInvestigation } from '../team/assignments'
import { remember } from '../stakeholders/relationships'
import { meetingAccount } from '../stakeholders/meeting'
import { computeStaffing } from '../programmes/progression'
import { pushMessage } from '../inbox/messages'
import { buildQuarterReview } from '../debrief/quarter'
import { effectsAsPaid, optionBudgetCost } from '../decisions/cost'
import { evaluateCondition } from '../events/conditions'
import { dateOf, yearWord } from '../time'

export type PlayerAction =
  | { type: 'advance'; days: number }
  | { type: 'setSpeed'; speed: GameState['speed'] }
  | { type: 'resolveDecision'; decisionId: string; optionId: string; rationaleTagIds: string[]; note?: string }
  | { type: 'startInvestigation'; investigationId: string; leaderId: string }
  | { type: 'createHypothesis'; templateId: string; evidenceIds: string[]; note?: string }
  | { type: 'attachEvidence'; hypothesisId: string; evidenceId: string; stance: 'supporting' | 'contradicting' }
  | { type: 'detachEvidence'; hypothesisId: string; evidenceId: string }
  | { type: 'convertHypothesis'; hypothesisId: string }
  | { type: 'rejectHypothesis'; hypothesisId: string }
  | { type: 'openRisk'; scenarioId: string }
  | { type: 'acceptRisk'; scenarioId: string; rationaleTagIds: string[]; assumptionDefIds: string[]; days: number }
  | { type: 'treatRisk'; scenarioId: string; programmeId: string }
  | { type: 'escalateRisk'; scenarioId: string; stakeholderId: string }
  | { type: 'startProgramme'; programmeId: string; budget: number; sponsorId?: string }
  | { type: 'setProgrammeStatus'; programmeId: string; status: 'active' | 'paused' }
  | { type: 'accelerateProgramme'; programmeId: string; budget: number }
  | { type: 'resolveProgrammeBlocker'; programmeId: string; blockerId: string }
  | { type: 'meetStakeholder'; stakeholderId: string; approach: 'listen' | 'brief' | 'press' }
  | { type: 'hire'; fn: CyberFunction }
  | { type: 'markRead'; messageId: string }
  | { type: 'markEvidenceRead'; evidenceId: string }
  | { type: 'completeQuarterReview'; quarter: number; topics: string[]; recommendations: string[]; communicateUncertainty: boolean }
  | { type: 'dismissPattern'; templateId: string }
  | { type: 'dismissTutorial'; id: string }
  | { type: 'finishCampaign' }

export interface ActionResult {
  ok: boolean
  /** Player-facing explanation; a refusal always says why. */
  message: string
  ticks?: TickResult[]
}

export function newGame(index: ContentIndex, options: NewGameOptions): GameState {
  const state = createInitialState(index, options)
  // The situation's own starting conditions, through the one reducer.
  const situation = state.situationId ? index.situation.get(state.situationId) : undefined
  if (situation && situation.setupEffects.length > 0) {
    const rng = createRng(state.seed, state.rngCursor)
    applyEffects(state, situation.setupEffects, { index, rng, source: `situation:${situation.id}` })
    state.rngCursor = rng.cursor
  }
  // The opening briefing lands before day 1 so the player starts with context.
  pushMessage(state, {
    from: 'Nexora Group',
    subject: 'Your first day',
    body: index.content.meta.openingBriefing,
    type: 'executive',
    priority: 'urgent',
    pinned: true,
  })
  // Run the first day immediately so the player arrives mid-morning with the
  // CEO already waiting, rather than at an empty desk (plan §6).
  tickDay(state, index)
  return state
}

export { beginNextYear } from './next-year'

/** What each kind of intervention costs of the player's week. Read by the screens that offer them. */
export const FOCUS_COSTS = {
  investigation: 1,
  deepRiskReview: 2,
  executiveIntervention: 1,
  programmeIntervention: 2,
  boardPreparation: 2,
  escalation: 1,
} as const

function fail(message: string): ActionResult {
  return { ok: false, message }
}

function spendFocus(state: GameState, amount: number): boolean {
  if (state.resources.focusRemaining < amount) return false
  state.resources.focusRemaining -= amount
  return true
}

function spendBudget(state: GameState, amount: number): boolean {
  if (amount <= 0) return true
  if (state.resources.budgetRemaining < amount) return false
  state.resources.budgetRemaining = Math.round((state.resources.budgetRemaining - amount) * 100) / 100
  return true
}

export { optionBudgetCost }

/** Why an option's cost may or may not be refused. See `budgetTreatment`. */
export function budgetBlockReason(state: GameState, option: DecisionOptionDef): string | undefined {
  const treatment = option.budgetTreatment ?? 'discretionary'
  if (treatment !== 'discretionary') return undefined
  const cost = optionBudgetCost(option)
  if (cost > 0 && state.resources.budgetRemaining < cost) {
    return `There is not enough budget left this year for that (it costs ${money(cost)}).`
  }
  return undefined
}

/**
 * Applies a player action in place. Callers own immutability (the store uses
 * Immer); the engine itself only needs determinism.
 */
export function applyAction(state: GameState, index: ContentIndex, action: PlayerAction): ActionResult {
  const rng = createRng(state.seed, state.rngCursor)
  const commit = () => {
    state.rngCursor = rng.cursor
    // Committed capacity is derived, so refresh it the moment the set of live
    // work changes. Otherwise a player could commission several investigations
    // in one day, each checked against a figure that predates the last.
    refreshCommittedCapacity(state, index)
    // Staffing is worked out at the start of each day's delivery, so a
    // programme started this morning read "Starved of people" and "Fragile"
    // until tomorrow, with its teams idle. Refreshing it here changes what
    // the screen says, not what the day computes.
    for (const programme of Object.values(state.programmes.programmes)) {
      if (programme.status === 'active' || programme.status === 'at-risk') programme.staffing = computeStaffing(state, index, programme)
    }
  }

  switch (action.type) {
    case 'setSpeed': {
      state.speed = action.speed
      state.paused = action.speed === 'paused'
      if (!state.paused) state.pauseReasons = []
      return { ok: true, message: '' }
    }

    case 'advance': {
      if (state.finished) return fail('The campaign year is over.')
      const ticks: TickResult[] = []
      for (let i = 0; i < action.days; i += 1) {
        if (state.currentDay >= CAMPAIGN_DAYS) break
        const result = tickDay(state, index)
        ticks.push(result)
        if (result.pauseReasons.length > 0) break
      }
      return { ok: true, message: '', ticks }
    }

    case 'resolveDecision': {
      const decision = state.decisions.decisions[action.decisionId]
      if (!decision) return fail('That decision no longer exists.')
      if (decision.resolvedDay !== undefined) return fail('That decision has already been taken.')
      const def = index.decision.get(decision.defId)
      if (!def) return fail('That decision is missing from the campaign content.')
      const option = def.options.find((o) => o.id === action.optionId)
      if (!option) return fail('That option is not available.')

      const requirements = option.requirements
      if (requirements?.budget && state.resources.budgetRemaining < requirements.budget) {
        return fail('There is not enough budget left this year for that option.')
      }
      if (requirements?.condition && !evaluateCondition(state, index, requirements.condition)) {
        return fail(requirements.conditionUnmet ?? 'That option is not open to you as the year stands.')
      }
      const budgetBlocked = budgetBlockReason(state, option)
      if (budgetBlocked) return fail(budgetBlocked)
      if (requirements?.focus && state.resources.focusRemaining < requirements.focus) {
        return fail('You have no attention left this week for that.')
      }
      if (requirements?.minTrustStakeholderId && requirements.minTrust !== undefined) {
        const person = state.stakeholders.stakeholders[requirements.minTrustStakeholderId]
        if (!person || person.trust < requirements.minTrust) {
          const def2 = index.stakeholder.get(requirements.minTrustStakeholderId)
          return fail(`${def2?.name ?? 'That executive'} will not back you on this yet.`)
        }
      }
      if (def.requiresRationale && action.rationaleTagIds.length === 0) {
        return fail('Record why you are taking this decision.')
      }
      if (def.rationaleTagIds && action.rationaleTagIds.some((tagId) => !def.rationaleTagIds!.includes(tagId))) {
        return fail('That is not a reason this decision can be taken for.')
      }

      if (requirements?.budget) spendBudget(state, requirements.budget)
      if (requirements?.focus) spendFocus(state, requirements.focus)

      // Emergency spend is allowed to exceed the year's allocation — that is
      // what makes it an emergency — but the shortfall is carried rather than
      // absorbed by the floor on `budget.change`. Recorded before the effects
      // apply, while the remaining balance still says what could be met.
      if ((option.budgetTreatment ?? 'discretionary') === 'emergency') {
        const shortfall = round2(Math.max(0, optionBudgetCost(option) - state.resources.budgetRemaining))
        if (shortfall > 0) {
          state.resources.unfundedCommitment = round2(state.resources.unfundedCommitment + shortfall)
        }
      }

      decision.selectedOptionId = option.id
      decision.resolvedDay = state.currentDay
      decision.rationaleTagIds = action.rationaleTagIds
      decision.note = action.note
      state.decisions.openIds = state.decisions.openIds.filter((id) => id !== action.decisionId)
      state.decisions.resolvedIds.push(action.decisionId)

      // A choice taken while an incident is running belongs to that incident's
      // record. The field existed and nothing ever wrote to it, so neither the
      // live command view nor the reconstruction could show what was decided
      // during the response.
      const liveIncident = Object.values(state.incidents.incidents).find(
        (candidate) => candidate.phase !== 'closed',
      )
      if (liveIncident) {
        liveIncident.decisionsTaken.push({
          decisionId: action.decisionId,
          optionId: option.id,
          day: state.currentDay,
        })
      }

      for (const assumptionDefId of option.assumptionIds ?? []) {
        const id = recordAssumption(state, { index, rng, source: 'decision' }, assumptionDefId, action.decisionId)
        if (id) decision.assumptionIds.push(id)
      }

      applyEffects(state, effectsAsPaid(state, option), {
        index,
        rng,
        source: `decision:${def.id}`,
        decisionId: action.decisionId,
        linkedScenarioId: decision.scenarioId,
      })
      for (const delayed of option.delayedEffects ?? []) {
        state.pendingEffects.push({
          id: `pending-${action.decisionId}-${delayed.dayOffset}`,
          day: state.currentDay + delayed.dayOffset,
          effects: delayed.effects,
          note: delayed.note,
          source: `decision:${def.id}`,
        })
      }

      state.history.decisionsLog.push({
        day: state.currentDay,
        decisionId: action.decisionId,
        optionId: option.id,
        rationaleTagIds: action.rationaleTagIds,
      })
      state.history.entries.push({
        day: state.currentDay,
        kind: 'decision',
        summary: `${def.title}: ${option.label}`,
        refs: [action.decisionId],
      })
      // Answering clears the pause it caused.
      state.pauseReasons = state.pauseReasons.filter((r: PauseReason) => r !== 'decision-deadline')
      commit()
      // The option's label alone ("Grant the exceptions") read, a moment after
      // the dialog closed, as an instruction rather than a record of one.
      return { ok: true, message: `Decided: ${def.title} — ${option.label}.` }
    }

    case 'startInvestigation': {
      const def = index.investigation.get(action.investigationId)
      if (!def) return fail('That line of enquiry is not available.')
      if (!def.repeatable) {
        const already = state.team.assignments.some((a) => a.refId === def.id)
        if (already) return fail('That work has already been commissioned.')
      }
      const leader = state.team.leaders[action.leaderId]
      if (!leader) return fail('That leader is not available.')
      if (!canAfford(state, def.capacityPerDay)) {
        return fail('That team does not have the capacity. Something else has to give.')
      }
      if (state.resources.focusRemaining < def.focusCost) {
        return fail('You have no attention left this week to direct that work.')
      }
      if (state.resources.budgetRemaining < def.budgetCost) {
        return fail('There is not enough budget for that.')
      }
      spendFocus(state, def.focusCost)
      spendBudget(state, def.budgetCost)
      const assignment = startInvestigation(state, index, def, action.leaderId, rng)
      if (!assignment) return fail('That work could not be started.')
      state.history.entries.push({
        day: state.currentDay,
        kind: 'investigation',
        summary: `Commissioned ${def.name} (${index.leader.get(action.leaderId)?.name ?? action.leaderId}).`,
        refs: [assignment.id],
      })
      commit()
      return { ok: true, message: `${def.name} commissioned. Expect a result around ${dateOf(assignment.dueDay)}.` }
    }

    case 'createHypothesis': {
      const template = index.hypothesisTemplate.get(action.templateId)
      if (!template) return fail('That hypothesis template is not available.')
      if (state.resources.focusRemaining < 1) return fail('You have no attention left this week.')
      spendFocus(state, 1)
      state.risks.hypothesisCounter += 1
      const id = `hyp-${state.risks.hypothesisCounter}`
      const hypothesis: HypothesisRuntime = {
        id,
        templateId: template.id,
        title: template.title,
        statement: template.statement,
        createdDay: state.currentDay,
        supportingEvidenceIds: [],
        contradictingEvidenceIds: [],
        confidence: 'low',
        status: 'draft',
        note: action.note,
      }
      for (const evidenceId of action.evidenceIds) {
        if (!state.evidence.items[evidenceId]) continue
        const def = index.evidence.get(evidenceId)
        if (!def) continue
        const contradicts = def.tags.some((tag) => template.contradictingTags.includes(tag))
        if (contradicts) hypothesis.contradictingEvidenceIds.push(evidenceId)
        else hypothesis.supportingEvidenceIds.push(evidenceId)
        state.evidence.items[evidenceId]?.linkedHypothesisIds.push(id)
      }
      state.risks.hypotheses[id] = hypothesis
      state.history.entries.push({
        day: state.currentDay,
        kind: 'hypothesis',
        summary: `Formed a hypothesis: ${template.title}`,
        refs: [id],
      })
      commit()
      // A hypothesis is a draft. Two playtesters formed eight between them,
      // raised none, and the board never heard of the one their incident
      // later took.
      return { ok: true, message: 'Hypothesis recorded as a draft. The board hears of it once you raise it as a risk scenario, under Risk, Hypotheses.' }
    }

    case 'attachEvidence': {
      const hypothesis = state.risks.hypotheses[action.hypothesisId]
      if (!hypothesis) return fail('That hypothesis no longer exists.')
      if (!state.evidence.items[action.evidenceId]) return fail('You do not hold that evidence.')
      const list =
        action.stance === 'supporting' ? hypothesis.supportingEvidenceIds : hypothesis.contradictingEvidenceIds
      if (!list.includes(action.evidenceId)) list.push(action.evidenceId)
      const other =
        action.stance === 'supporting' ? hypothesis.contradictingEvidenceIds : hypothesis.supportingEvidenceIds
      const index2 = other.indexOf(action.evidenceId)
      if (index2 >= 0) other.splice(index2, 1)
      return { ok: true, message: 'Evidence attached.' }
    }

    case 'detachEvidence': {
      const hypothesis = state.risks.hypotheses[action.hypothesisId]
      if (!hypothesis) return fail('That hypothesis no longer exists.')
      hypothesis.supportingEvidenceIds = hypothesis.supportingEvidenceIds.filter((id) => id !== action.evidenceId)
      hypothesis.contradictingEvidenceIds = hypothesis.contradictingEvidenceIds.filter(
        (id) => id !== action.evidenceId,
      )
      return { ok: true, message: 'Evidence detached.' }
    }

    case 'convertHypothesis': {
      const hypothesis = state.risks.hypotheses[action.hypothesisId]
      if (!hypothesis) return fail('That hypothesis no longer exists.')
      const template = index.hypothesisTemplate.get(hypothesis.templateId)
      if (!template) return fail('That hypothesis template is missing.')
      // The workspace hides the button once a hypothesis is raised, but the
      // rule belongs where it is decided: a second conversion charged
      // attention again, wrote a duplicate "raised from a hypothesis" note and
      // a second history entry, and reopened a scenario the player had since
      // accepted — discarding a recorded rationale without saying so.
      if (hypothesis.status === 'converted') return fail('That hypothesis has already been raised as a risk scenario.')
      if (hypothesis.status === 'rejected') return fail('You set that hypothesis aside.')
      if (hypothesis.supportingEvidenceIds.length === 0) {
        return fail('A risk scenario needs at least one piece of supporting evidence behind it.')
      }
      if (state.resources.focusRemaining < FOCUS_COSTS.deepRiskReview) {
        return fail('Working a hypothesis up into a risk scenario needs more attention than you have left this week.')
      }
      spendFocus(state, FOCUS_COSTS.deepRiskReview)
      hypothesis.status = 'converted'
      hypothesis.linkedScenarioId = template.linkedScenarioId
      applyEffects(state, [{ type: 'risk.open', scenarioId: template.linkedScenarioId }], {
        index,
        rng,
        source: 'hypothesis',
      })
      const scenario = state.risks.scenarios[template.linkedScenarioId]
      if (scenario) {
        scenario.notes.unshift(`Raised from a hypothesis on ${dateOf(state.currentDay)}.`)
        scenario.status = 'open'
      }
      state.history.entries.push({
        day: state.currentDay,
        kind: 'risk-opened',
        summary: `${hypothesis.title} became a formal risk scenario.`,
        refs: [template.linkedScenarioId],
      })
      commit()
      return { ok: true, message: 'The hypothesis is now a formal risk scenario.' }
    }

    case 'rejectHypothesis': {
      const hypothesis = state.risks.hypotheses[action.hypothesisId]
      if (!hypothesis) return fail('That hypothesis no longer exists.')
      hypothesis.status = 'rejected'
      return { ok: true, message: 'Hypothesis set aside.' }
    }

    case 'openRisk': {
      applyEffects(state, [{ type: 'risk.open', scenarioId: action.scenarioId }], { index, rng, source: 'player' })
      commit()
      return { ok: true, message: 'Risk scenario opened.' }
    }

    case 'acceptRisk': {
      const scenario = state.risks.scenarios[action.scenarioId]
      if (!scenario) return fail('That risk scenario is not open.')
      if (action.rationaleTagIds.length === 0) return fail('Record why you are accepting this risk.')
      scenario.status = 'accepted'
      scenario.acceptedUntilDay = state.currentDay + Math.max(30, action.days)
      scenario.nextReviewDay = scenario.acceptedUntilDay
      for (const assumptionDefId of action.assumptionDefIds) {
        const id = recordAssumption(state, { index, rng, source: 'risk-acceptance' }, assumptionDefId, undefined, action.scenarioId)
        if (id && !scenario.assumptionIds.includes(id)) scenario.assumptionIds.push(id)
      }
      const def = index.riskScenario.get(action.scenarioId)
      state.history.entries.push({
        day: state.currentDay,
        kind: 'risk-accepted',
        summary: `Accepted ${def?.title ?? action.scenarioId} for ${action.days} days.`,
        refs: [action.scenarioId, ...action.rationaleTagIds],
      })
      // The owner is told, and remembers.
      remember(state, scenario.ownerStakeholderId, `You accepted ${def?.title ?? 'a risk'} on ${dateOf(state.currentDay)}.`, 'neutral')
      answeredOnRiskScreen(state, action.scenarioId, 'opt-renewal-renew', action.rationaleTagIds)
      commit()
      return { ok: true, message: 'Risk accepted and recorded with its assumptions.' }
    }

    case 'treatRisk': {
      const scenario = state.risks.scenarios[action.scenarioId]
      if (!scenario) return fail('That risk scenario is not open.')
      const programme = state.programmes.programmes[action.programmeId]
      if (!programme) return fail('That programme does not exist.')
      if (programme.status === 'proposed') return fail('Start the programme before pointing a risk at it.')
      scenario.status = 'treated'
      scenario.nextReviewDay = state.currentDay + 60
      scenario.notes.unshift(`Treatment: ${index.programme.get(action.programmeId)?.name ?? action.programmeId}.`)
      answeredOnRiskScreen(state, action.scenarioId, 'opt-renewal-reassess', [])
      return { ok: true, message: 'Risk linked to its treatment programme.' }
    }

    case 'escalateRisk': {
      const scenario = state.risks.scenarios[action.scenarioId]
      if (!scenario) return fail('That risk scenario is not open.')
      if (!spendFocus(state, FOCUS_COSTS.escalation)) return fail('You have no attention left this week.')
      const person = state.stakeholders.stakeholders[action.stakeholderId]
      const def = index.riskScenario.get(action.scenarioId)
      const personDef = index.stakeholder.get(action.stakeholderId)
      if (!person || !personDef) return fail('That executive is not available.')

      // Escalating with evidence builds credibility; escalating everything does not.
      const recentEscalations = state.history.entries.filter(
        (e) => e.kind === 'escalation' && state.currentDay - e.day < 60,
      ).length
      const wellFounded = scenario.confidence !== 'limited'
      const delta = wellFounded ? 0.06 - recentEscalations * 0.015 : -0.03 - recentEscalations * 0.01
      applyEffects(
        state,
        [
          { type: 'stakeholder.trust', stakeholderId: action.stakeholderId, delta, reason: `You escalated ${def?.title ?? 'a risk'}.` },
          { type: 'stakeholder.understanding', stakeholderId: action.stakeholderId, delta: 0.04 },
        ],
        { index, rng, source: 'escalation' },
      )
      scenario.ownerStakeholderId = action.stakeholderId
      state.history.entries.push({
        day: state.currentDay,
        kind: 'escalation',
        summary: `Escalated ${def?.title ?? action.scenarioId} to ${personDef.name}.`,
        refs: [action.scenarioId],
      })
      commit()
      return {
        ok: true,
        message: wellFounded
          ? `${personDef.name} takes the ownership seriously.`
          : `${personDef.name} listens, but is unconvinced by how little you can show.`,
      }
    }

    case 'startProgramme': {
      const def = index.programme.get(action.programmeId)
      const programme = state.programmes.programmes[action.programmeId]
      if (!def || !programme) return fail('That programme does not exist.')
      if (programme.status !== 'proposed' && programme.status !== 'paused') {
        return fail('That programme is already under way.')
      }
      const budget = Math.max(0, Math.round(action.budget))
      if (budget <= 0) return fail('A programme needs funding to start.')
      if (!spendBudget(state, budget)) return fail('There is not enough budget left this year.')
      if (!spendFocus(state, FOCUS_COSTS.programmeIntervention)) {
        spendBudget(state, -budget)
        return fail('Standing a programme up takes more attention than you have left this week.')
      }
      programme.budgetAllocated += budget
      programme.status = 'active'
      programme.startedDay ??= state.currentDay
      programme.sponsorId = action.sponsorId ?? def.preferredSponsorId
      if (programme.sponsorId) {
        remember(state, programme.sponsorId, `You asked them to sponsor ${def.name}.`, 'neutral')
      }
      state.history.entries.push({
        day: state.currentDay,
        kind: 'programme-started',
        summary: `Started ${def.name} with ${money(budget)}.`,
        refs: [def.id],
      })
      commit()
      return { ok: true, message: `${def.name} is under way.` }
    }

    case 'setProgrammeStatus': {
      const programme = state.programmes.programmes[action.programmeId]
      const def = index.programme.get(action.programmeId)
      if (!programme || !def) return fail('That programme does not exist.')
      if (programme.status === 'complete') return fail('That programme is already finished.')
      programme.status = action.status
      state.history.entries.push({
        day: state.currentDay,
        kind: 'programme-status',
        summary: `${def.name} ${action.status === 'paused' ? 'paused' : 'resumed'}.`,
        refs: [def.id],
      })
      // Pausing frees the people it was holding; resuming takes them back.
      commit()
      return { ok: true, message: action.status === 'paused' ? `${def.name} paused.` : `${def.name} resumed.` }
    }

    case 'accelerateProgramme': {
      const programme = state.programmes.programmes[action.programmeId]
      const def = index.programme.get(action.programmeId)
      if (!programme || !def) return fail('That programme does not exist.')
      if (programme.status !== 'active' && programme.status !== 'at-risk') {
        return fail('Only a live programme can be accelerated.')
      }
      if (!spendBudget(state, action.budget)) return fail('There is not enough budget left this year.')
      if (!spendFocus(state, FOCUS_COSTS.programmeIntervention)) {
        spendBudget(state, -action.budget)
        return fail('You have no attention left this week to push that programme.')
      }
      programme.budgetAllocated += action.budget
      programme.accelerated = true
      // Pushing delivery teams harder has a cost elsewhere.
      applyEffects(
        state,
        [
          { type: 'team.morale', delta: -0.03 },
          { type: 'operationalTolerance', delta: -0.04 },
        ],
        { index, rng, source: 'acceleration' },
      )
      commit()
      return { ok: true, message: `${def.name} accelerated. The delivery teams have noticed.` }
    }

    case 'resolveProgrammeBlocker': {
      const programme = state.programmes.programmes[action.programmeId]
      const def = index.programme.get(action.programmeId)
      if (!programme || !def) return fail('That programme does not exist.')
      const blockerDef = def.blockers.find((b) => b.id === action.blockerId)
      const active = programme.blockers.find((b) => b.id === action.blockerId && !b.resolved)
      if (!blockerDef || !active) return fail('That blocker is not active.')
      if (blockerDef.resolution.budget && !spendBudget(state, blockerDef.resolution.budget)) {
        return fail('There is not enough budget to clear that blocker.')
      }
      if (blockerDef.resolution.focus && !spendFocus(state, blockerDef.resolution.focus)) {
        return fail('Clearing that blocker needs attention you do not have this week.')
      }
      applyEffects(state, [{ type: 'programme.resolveBlocker', programmeId: def.id, blockerId: action.blockerId }], {
        index,
        rng,
        source: 'blocker',
      })
      if (blockerDef.resolution.stakeholderId) {
        remember(state, blockerDef.resolution.stakeholderId, `You asked them to unblock ${def.name}.`, 'neutral')
        applyEffects(
          state,
          [{ type: 'stakeholder.trust', stakeholderId: blockerDef.resolution.stakeholderId, delta: -0.02 }],
          { index, rng, source: 'blocker' },
        )
      }
      commit()
      return { ok: true, message: blockerDef.resolution.description }
    }

    case 'meetStakeholder': {
      const person = state.stakeholders.stakeholders[action.stakeholderId]
      const def = index.stakeholder.get(action.stakeholderId)
      if (!person || !def) return fail('That executive is not available.')
      if (!spendFocus(state, FOCUS_COSTS.executiveIntervention)) {
        return fail('You have no attention left this week.')
      }
      const effects: GameEffect[] = []
      // Pressing works when trust is already there and costs you when it is not.
      const receptive = person.trust > 0.55
      const account = meetingAccount(state, index, def.id, action.approach, receptive)
      switch (action.approach) {
        case 'listen':
          effects.push({ type: 'stakeholder.trust', stakeholderId: def.id, delta: 0.05, reason: account.memory })
          break
        case 'brief':
          effects.push(
            { type: 'stakeholder.trust', stakeholderId: def.id, delta: 0.03, reason: account.memory },
            { type: 'stakeholder.understanding', stakeholderId: def.id, delta: 0.07 },
          )
          break
        default:
          effects.push({ type: 'stakeholder.trust', stakeholderId: def.id, delta: receptive ? 0.02 : -0.06, reason: account.memory })
          effects.push({ type: 'operationalTolerance', delta: receptive ? 0.03 : -0.03 })
          break
      }
      applyEffects(state, effects, { index, rng, source: 'meeting' })
      state.history.entries.push({
        day: state.currentDay,
        kind: 'meeting',
        summary: `Met ${def.name} (${action.approach}).`,
        refs: [def.id],
      })
      // What was said, kept where the player can find it again. It came only
      // as a toast, and a toast is gone before the next screen.
      pushMessage(state, {
        from: `${def.name}, ${def.role}`,
        subject: `Your meeting with ${def.name}`,
        body: account.message,
        type: def.id === 'stk-board' ? 'board' : 'executive',
        priority: 'routine',
        relatedNodeIds: [],
      }).read = true
      commit()
      return { ok: true, message: account.message }
    }

    case 'hire': {
      const fn = state.team.functions[action.fn]
      if (!fn) return fail('That function does not exist.')
      if (fn.vacancies <= 0) return fail('There is no open vacancy in that team.')
      const cost = 120
      if (!spendBudget(state, cost)) return fail('There is not enough budget to recruit.')
      state.pendingEffects.push({
        id: `hire-${action.fn}-${state.currentDay}`,
        day: state.currentDay + 60,
        effects: [
          { type: 'team.vacancyFilled', fn: action.fn },
          { type: 'team.morale', fn: action.fn, delta: 0.06 },
        ],
        note: `A new hire has joined the ${functionName(action.fn)} team.`,
        source: 'hiring',
      })
      commit()
      return { ok: true, message: 'Recruitment is under way. Expect about two months.' }
    }

    case 'markRead': {
      const message = state.inbox.messages.find((m) => m.id === action.messageId)
      if (message) message.read = true
      return { ok: true, message: '' }
    }

    case 'markEvidenceRead': {
      const item = state.evidence.items[action.evidenceId]
      if (item) item.read = true
      return { ok: true, message: '' }
    }

    case 'completeQuarterReview': {
      if (!spendFocus(state, FOCUS_COSTS.boardPreparation)) {
        return fail('Board preparation takes attention you do not have this week.')
      }
      const review = buildQuarterReview(state, index, {
        quarter: action.quarter,
        topics: action.topics,
        recommendations: action.recommendations,
        communicateUncertainty: action.communicateUncertainty,
      })
      state.reviews.quarters.push(review)
      state.reviews.pendingQuarter = undefined
      applyEffects(state, review.effects, { index, rng, source: 'board' })
      // The committee's reading of the paper, kept. It came only as a toast,
      // gone in a moment: the one lesson the first quarter's board gives, and
      // a playtester who looked away lost it (AI panel, 2026-10-09).
      pushMessage(state, {
        from: 'Sir Alan Whitcombe, Chair, Board Risk Committee',
        subject: `The committee on your Q${action.quarter} paper`,
        body: review.boardReaction,
        type: 'board',
        priority: 'notable',
        relatedNodeIds: [],
      })
      state.pauseReasons = state.pauseReasons.filter((r: PauseReason) => r !== 'quarter-end')
      commit()
      return { ok: true, message: review.boardReaction }
    }

    case 'dismissPattern': {
      const dismissed = (state.risks.dismissedPatternIds ??= [])
      if (!dismissed.includes(action.templateId)) dismissed.push(action.templateId)
      return { ok: true, message: 'Noted. That one will not be raised again.' }
    }

    case 'dismissTutorial': {
      if (!state.tutorial.dismissed.includes(action.id)) state.tutorial.dismissed.push(action.id)
      return { ok: true, message: '' }
    }

    case 'finishCampaign': {
      // Closes the year. The review is written by `finishYear`
      // (src/game/debrief/review.ts), which loads with the review screen.
      state.finished = true
      return { ok: true, message: `Your ${yearWord(state.year)} year is complete.` }
    }

    default: {
      const exhaustive: never = action
      void exhaustive
      return fail('Unknown action.')
    }
  }
}

/** Convenience wrapper used by headless simulations and tests. */
export function runDays(state: GameState, index: ContentIndex, days: number): TickResult[] {
  const results: TickResult[] = []
  for (let i = 0; i < days; i += 1) {
    if (state.currentDay >= CAMPAIGN_DAYS) break
    results.push(tickDay(state, index))
  }
  return results
}

export function residualExposureAverage(state: GameState): number {
  const values = Object.values(state.risks.scenarios)
    .map((s) => s.lastAssessed?.residual)
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return 0
  return clamp01(values.reduce((sum, v) => sum + v, 0) / values.length)
}

/**
 * An acceptance that has run out can be answered on the Risk screen as well
 * as by its decision. A player who re-accepted there was later told the
 * decision had lapsed to "Let it sit on the open register", which also undid
 * the acceptance (second-year AI playtest). What they did on the Risk screen
 * is recorded as their answer, and the decision closes.
 */
function answeredOnRiskScreen(state: GameState, scenarioId: string, optionId: string, rationaleTagIds: string[]): void {
  for (const id of [...state.decisions.openIds]) {
    const decision = state.decisions.decisions[id]
    if (!decision || decision.defId !== 'dec-acceptance-renewal' || decision.scenarioId !== scenarioId) continue
    decision.selectedOptionId = optionId
    decision.resolvedDay = state.currentDay
    decision.rationaleTagIds = rationaleTagIds
    decision.note = 'Answered on the Risk screen.'
    state.decisions.openIds = state.decisions.openIds.filter((open) => open !== id)
    state.decisions.resolvedIds.push(id)
    state.history.decisionsLog.push({ day: state.currentDay, decisionId: id, optionId, rationaleTagIds })
  }
}
