/**
 * A year that follows another (docs/ROADMAP.md, Phase 6: "a second year that
 * remembers the first").
 *
 * The world carries over: the same Nexora, with what the player found, the
 * controls they built, the programmes still running, the people they worked
 * with and the risks they chose to carry. What a year owns starts again: the
 * inbox, the decisions, the incidents, the board's papers, the business's
 * plans and the budget. What the review and the choices knew is kept as a
 * `YearRecord`, which the next year's content reads through the `lastYear.*`
 * conditions.
 *
 * Pure, like the rest of the engine: same finished year, same next year.
 */
import type { ContentIndex, GameState, YearRecord } from '../types'
import { CAMPAIGN_DAYS, clamp01 } from '../types'
import { DIFFICULTY_PROFILES } from './setup'
import { deriveRng } from './rng'
import { evidenceIsStale, recomputeUnderstanding } from '../knowledge/discovery'
import { assessScenario } from '../risk/calculations'
import { refreshCommittedCapacity } from '../team/capacity'
import { tickDay } from './tick'

/** Day 0 of the next year is the day after the last day of this one. */
export const YEAR_SHIFT = CAMPAIGN_DAYS + 1

/**
 * What the autumn budget decision does to next year's line: a fifth less if
 * the player accepted the cut, half of that if they offered a named line, and
 * the line as it stood otherwise.
 */
const BUDGET_AFTER: Record<string, number> = { cut: 0.8, trimmed: 0.9, held: 1 }

/** How far relationships, the board and morale drift back towards where they started over a new year. */
const TRUST_SETTLES = 0.2
const MORALE_RECOVERS = 0.4

/** Whether a finished year can be followed by another. */
export function canBeginNextYear(state: GameState): boolean {
  return state.finished && state.reviews.annual !== undefined
}

/** What the finished year leaves for the next one to remember. */
export function recordYear(state: GameState): YearRecord {
  const annual = state.reviews.annual
  const decisions: Record<string, string> = {}
  for (const decision of Object.values(state.decisions.decisions).sort((a, b) => a.createdDay - b.createdDay)) {
    if (decision.selectedOptionId) decisions[decision.defId] = decision.selectedOptionId
  }
  const objectives = Object.values(state.business.objectives)
  return {
    year: state.year ?? 1,
    gameId: state.gameId,
    headline: annual?.headline ?? '',
    performanceBand: annual?.performanceBand ?? '',
    dimensions: Object.fromEntries((annual?.dimensions ?? []).map((d) => [d.id, d.band])),
    incidents: state.incidents.order.length,
    papersWritten: state.reviews.quarters.filter((q) => q.completed).length,
    objectivesMet: objectives.filter((o) => o.status === 'achieved').length,
    objectivesTotal: objectives.length,
    budgetTotal: state.resources.budgetTotal,
    ...(state.situationId ? { situationId: state.situationId } : {}),
    decisions,
  }
}

/** The budget the next year starts with, before anything that year changes it. */
export function nextYearBudget(state: GameState, index: ContentIndex): number {
  const profile = DIFFICULTY_PROFILES[state.difficulty]
  const standing = index.content.meta.startingBudget * profile.budgetMultiplier
  const decided = BUDGET_AFTER[String(state.flags['next-year.budget'] ?? 'held')] ?? 1
  // Money committed beyond last year's allocation is next year's first call
  // on the line: the review said it was "left for finance to fund", and this
  // is finance funding it. Bounded, so one bad autumn cannot end the next
  // year before it starts.
  const owed = Math.min(state.resources.unfundedCommitment, standing * 0.25)
  return Math.round(standing * decided - owed)
}

const shift = (day: number) => day - YEAR_SHIFT
const shiftOptional = (day: number | undefined) => (day === undefined ? undefined : shift(day))

export function createNextYear(index: ContentIndex, previous: GameState): GameState {
  if (!canBeginNextYear(previous)) throw new Error('A year can only follow one that has finished and been reviewed.')
  const state = JSON.parse(JSON.stringify(previous)) as GameState
  const year = (previous.year ?? 1) + 1
  const record = recordYear(previous)
  const profile = DIFFICULTY_PROFILES[state.difficulty]
  const rng = deriveRng(previous.seed, `year-${year}`)

  state.year = year
  state.previousYears = [...(previous.previousYears ?? []), record]
  state.gameId = `${previous.gameId.replace(/~y\d+$/, '')}~y${year}`
  state.currentDay = 0
  state.speed = 'paused'
  state.paused = true
  state.pauseReasons = []
  state.finished = false
  // The situation was how the first year began. A later year begins from
  // the year before it.
  delete state.situationId

  // The estate and what the player knows of it carry as they were.
  for (const node of Object.values(state.organisation.nodes)) {
    if (node.retiredOnDay !== undefined) node.retiredOnDay = shift(node.retiredOnDay)
  }

  // Controls keep what was built. What the player believes about them is
  // a year older.
  for (const control of Object.values(state.controls.controls)) {
    if (control.believed) control.believed.assessedOnDay = shift(control.believed.assessedOnDay)
  }

  // Finished programmes stay finished; running ones keep running, already paid for.
  for (const programme of Object.values(state.programmes.programmes)) {
    programme.startedDay = shiftOptional(programme.startedDay)
    programme.completedDay = shiftOptional(programme.completedDay)
    for (const blocker of programme.blockers) blocker.startedDay = shift(blocker.startedDay)
  }

  // Risks carry, and so do the acceptances on them, to the dates they were
  // given. A review that fell due over the new year comes back in January
  // rather than all on the first morning.
  const carriedScenarios = Object.values(state.risks.scenarios)
  carriedScenarios.forEach((scenario, i) => {
    scenario.openedDay = shift(scenario.openedDay)
    scenario.nextReviewDay = Math.max(shift(scenario.nextReviewDay), 14 + 3 * i)
    scenario.acceptedUntilDay = shiftOptional(scenario.acceptedUntilDay)
    if (scenario.lastAssessed) scenario.lastAssessed.day = shift(scenario.lastAssessed.day)
    if (scenario.firstAssessed) scenario.firstAssessed.day = shift(scenario.firstAssessed.day)
    // The decisions were last year's; the record keeps what they chose.
    scenario.decisionIds = []
  })
  for (const hypothesis of Object.values(state.risks.hypotheses)) hypothesis.createdDay = shift(hypothesis.createdDay)
  for (const item of Object.values(state.evidence.items)) {
    item.discoveredDay = shift(item.discoveredDay)
    item.expiresOnDay = shiftOptional(item.expiresOnDay)
    // Last year's findings are not this morning's news.
    item.read = true
  }
  // What the year made untrue goes: a programme fixed it, or it only ever
  // described the year the player arrived ("Exploit published … this week",
  // "Platform launch date is fixed and public"). A second year opened with all
  // of them, dated "1 Jan" (second-year AI playtest).
  for (const id of Object.keys(state.evidence.items)) {
    if (evidenceIsStale(state, index, id)) delete state.evidence.items[id]
  }
  state.evidence.order = state.evidence.order.filter((id) => state.evidence.items[id])

  // An acceptance rests on what was assumed when it was made, so those
  // assumptions carry with it. The rest belonged to last year's decisions.
  const accepted = new Set(carriedScenarios.filter((s) => s.status === 'accepted').map((s) => s.id))
  for (const [id, assumption] of Object.entries(state.assumptions.assumptions)) {
    const stillCarried = assumption.status !== 'invalidated' && assumption.linkedScenarioIds.some((s) => accepted.has(s))
    if (!stillCarried) {
      delete state.assumptions.assumptions[id]
      continue
    }
    delete assumption.linkedDecisionId
    assumption.createdDay = shift(assumption.createdDay)
    assumption.reviewedDay = shiftOptional(assumption.reviewedDay)
    assumption.nextReviewDay = shiftOptional(assumption.nextReviewDay)
  }
  for (const scenario of carriedScenarios) {
    scenario.assumptionIds = scenario.assumptionIds.filter((id) => state.assumptions.assumptions[id])
  }

  // People remember, and a new year softens it. Their last few memories of
  // the player stay, dated last year.
  for (const person of Object.values(state.stakeholders.stakeholders)) {
    const base = index.stakeholder.get(person.id)?.baseTrust ?? 0.5
    person.trust = clamp01(person.trust + (base - person.trust) * TRUST_SETTLES)
    person.memory = person.memory.slice(-5).map((m) => ({ ...m, day: shift(m.day) }))
    // Last year's worries were about last year's plans. "Anything that
    // delays the launch" stayed on Priya's card after the launch (second-year
    // AI playtest).
    const later = index.stakeholder.get(person.id)?.laterConcerns
    if (later) person.concerns = later.slice(0, 3)
  }
  const board = state.stakeholders
  board.boardConfidence = clamp01(board.boardConfidence + (0.5 - board.boardConfidence) * TRUST_SETTLES)
  board.operationalTolerance = clamp01(board.operationalTolerance + (profile.executiveTolerance - board.operationalTolerance) * 0.5)

  // The team comes back from the break: the same people, rested, with the
  // work that was running stopped and the hiring still in hand.
  state.team.assignments = []
  // Rest lifts a tired team; it does not flatten a keen one. Pulling both
  // ways turned "energised" in December into "Steady" on 2 January (AI
  // second-year re-test).
  for (const fn of Object.values(state.team.functions)) {
    if (fn.morale < 0.62) fn.morale = clamp01(fn.morale + (0.62 - fn.morale) * MORALE_RECOVERS)
    fn.surge = 0
  }
  for (const leader of Object.values(state.team.leaders)) {
    const base = index.leader.get(leader.id)?.baseMorale ?? 0.6
    if (leader.morale < base) leader.morale = clamp01(leader.morale + (base - leader.morale) * MORALE_RECOVERS)
    leader.workload = 0.35
    leader.assignmentsCompleted = 0
    leader.assignmentsLate = 0
  }

  // The adversaries have not gone anywhere. A campaign still under way
  // carries on; one that became an incident, or was stopped, is last year's.
  for (const actor of Object.values(state.threats.actors)) {
    actor.pressure = clamp01(actor.pressure * 0.5)
    actor.lastCampaignDay = shiftOptional(actor.lastCampaignDay)
    actor.setbackUntilDay = shiftOptional(actor.setbackUntilDay)
  }
  state.threats.campaigns = state.threats.campaigns
    .filter((c) => !c.disrupted && !c.incidentId && !c.heldAt)
    .map((c) => ({ ...c, startedDay: shift(c.startedDay), lastAdvanceDay: shift(c.lastAdvanceDay) }))

  // What a year owns starts again. Counters carry, so ids stay unique
  // across the years.
  state.inbox = { messages: [], counter: previous.inbox.counter }
  state.decisions = { decisions: {}, openIds: [], resolvedIds: [], counter: previous.decisions.counter }
  state.incidents = { incidents: {}, order: [], counter: previous.incidents.counter }
  state.history = { entries: [], weekly: [], decisionsLog: [] }
  state.reviews = { quarters: [] }

  // Content that has already been said is not said again; anything that was
  // waiting for the new year still arrives.
  const events = state.events
  events.firedOnDay = Object.fromEntries(Object.entries(events.firedOnDay).map(([id, day]) => [id, shift(day)]))
  events.lastFiredDayByTag = Object.fromEntries(
    Object.entries(events.lastFiredDayByTag).map(([tag, day]) => [tag, shift(day)]),
  )
  events.scheduled = events.scheduled.filter((s) => s.day >= YEAR_SHIFT).map((s) => ({ ...s, day: shift(s.day) }))
  events.dailyFiredCount = 0
  state.pendingEffects = state.pendingEffects.filter((p) => p.day >= YEAR_SHIFT).map((p) => ({ ...p, day: shift(p.day) }))

  // A flag is something a year's content said happened. The record keeps
  // last year's choices; the one flag that describes the estate rather than
  // a choice carries, dated from this year.
  const retirement = previous.flags['legacy.retirementDay']
  state.flags = typeof retirement === 'number' ? { 'legacy.retirementDay': shift(retirement) } : {}
  // What last year's emergency spend takes from this year's line, for the
  // letter that explains it.
  if (previous.resources.unfundedCommitment > 0) state.flags['year.owed'] = true

  // The budget is set again, on the line the autumn agreed.
  const budget = nextYearBudget(previous, index)
  state.resources = {
    budgetTotal: budget,
    budgetRemaining: budget,
    budgetCommitted: 0,
    unfundedCommitment: 0,
    focusPerWeek: profile.focusPerWeek,
    focusRemaining: profile.focusPerWeek,
    weekIndex: 0,
  }

  // The business has a new year's plans.
  state.business = { objectives: {}, serviceHealth: {}, outageDays: {} }
  for (const def of index.content.objectives) {
    if ((def.year ?? 1) !== year) continue
    state.business.objectives[def.id] = {
      id: def.id,
      progress: clamp01(rng.range(0.02, 0.12)),
      status: 'planned',
      targetDay: def.targetDay,
      delayDays: 0,
      conditionsAttached: [],
      securitySupported: false,
    }
  }
  for (const service of index.content.services) {
    state.business.serviceHealth[service.nodeId] = 1
    state.business.outageDays[service.nodeId] = 0
  }

  refreshCommittedCapacity(state, index)
  // Prioritisation is judged against the world as this year found it: the
  // risks that mattered on this year's first morning, after last year's work.
  state.risks.initialMateriality = {}
  for (const def of index.content.riskScenarios) {
    state.risks.initialMateriality[def.id] = assessScenario(state, index, def).residual
  }
  recomputeUnderstanding(state, index)
  return state
}

/**
 * The year after a finished one, with its first day run. Its opening is
 * authored content gated on `campaign.yearAtLeast`, so the first day is run
 * here just as `newGame` runs it for a new campaign.
 */
export function beginNextYear(index: ContentIndex, previous: GameState): GameState {
  const state = createNextYear(index, previous)
  tickDay(state, index)
  return state
}
