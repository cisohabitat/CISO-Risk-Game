import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { overallAssessment } from '@/game/debrief/assessment'
import { buildAnnualReview } from '@/game/debrief/review'
import { buildQuarterReview } from '@/game/debrief/quarter'
import { scaledPostIncidentAmount } from '@/game/budget/post-incident'
import { openDecision } from '@/game/decisions/open'
import { SKIP_LIMIT_DAYS } from '@/game/time'
import type { AnnualReviewDimension } from '@/game/types'

// The owner's "fix all" of 28 November, on the 427b290 playtest's design list:
// docs/playtests/2026-11-27-owner-supplied-427b290-matrix.md.
const index = testIndex()
const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
const strong = ids.map((id) => ({ id, label: id, band: 'strong', narrative: '', evidence: [] })) as unknown as AnnualReviewDimension[]
const dimension = (state: ReturnType<typeof newGame>, id: string) => buildAnnualReview(state, index).dimensions.find((d) => d.id === id)!

function quiet(seed: string, day = 100) {
  const state = newGame(index, { seed })
  state.currentDay = day
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  state.flags['incident.floor'] = true
  state.decisions.openIds = []
  state.threats.actors = {}; state.threats.campaigns = []
  state.pendingEffects = []
  for (const objective of Object.values(state.business.objectives)) objective.status = 'achieved'
  return state
}

describe('design list of 28 November', () => {
  it('MJ-01: every closed incident is asked about by the next day', () => {
    const state = quiet('reflect-next-day')
    state.events.suppressedEventIds = state.events.suppressedEventIds.filter((id) => id !== 'evt-org-post-incident')
    const incident = createIncident(state, index, { familyId: 'fam-data-theft' })!
    let day = 0
    while (incident.phase !== 'closed' && day < 200) { runDays(state, index, 1); day += 1 }
    expect(incident.phase).toBe('closed')
    runDays(state, index, 2)
    const asked = Object.values(state.decisions.decisions).find((d) => d.defId === 'dec-post-incident' && d.incidentId === incident.id)
    expect(asked!.createdDay).toBeLessThanOrEqual((incident.resolvedDay ?? incident.phaseEnteredDay) + 1)
  })

  it('MJ-02: Skip ahead stops after three weeks of nothing', () => {
    const state = quiet('skip-cap')
    const result = applyAction(state, index, { type: 'advance', days: 364, stopOnUpdate: true })
    expect(state.currentDay).toBe(100 + SKIP_LIMIT_DAYS)
    expect(result.message).toContain('three weeks have passed')
  })

  it('MJ-24: a ransom paid, a repeat route or debt caps the verdict at Mixed', () => {
    expect(overallAssessment(strong, true, { met: 5, total: 5 }, undefined, 'a ransom was paid')).toEqual({ label: 'Mixed', reason: 'a ransom was paid' })
    const state = quiet('repeat-route', 363)
    for (const day of [50, 200]) {
      const incident = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
      incident.startedDay = day; incident.phase = 'closed'; incident.consequence = 0.4
    }
    const review = buildAnnualReview(state, index)
    expect(['Mixed', 'Difficult'].some((label) => review.performanceBand.startsWith(label))).toBe(true)
    // MJ-28: two encryptions through one route cap resilience at developing.
    expect(['developing', 'weak']).toContain(review.dimensions.find((d) => d.id === 'resilience')!.band)
  })

  it('MJ-07: telling the board an incident was in hand when it was not caps communication at developing', () => {
    const state = quiet('in-hand', 363)
    state.stakeholders.boardConfidence = 0.95
    for (const quarter of [1, 2, 3]) state.reviews.quarters.push({ quarter, day: quarter * 91, topicsChosen: ['risk:fixture'], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    expect(dimension(state, 'communication').band).toBe('strong')
    const incident = createIncident(state, index, { familyId: 'fam-data-breach' })!
    incident.phase = 'closed'; incident.consequence = 0.5; incident.boardInformedDay = incident.startedDay + 1; incident.boardBriefingTone = 'reassuring'
    expect(dimension(state, 'communication').band).toBe('developing')
  })

  it('MJ-08: two empty papers cap communication at developing', () => {
    const state = quiet('empty-papers', 363)
    state.stakeholders.boardConfidence = 0.95
    for (const quarter of [1, 2, 3]) state.reviews.quarters.push({ quarter, day: quarter * 91, topicsChosen: quarter === 1 ? ['risk:fixture'] : [], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    expect(dimension(state, 'communication').band).toBe('developing')
  })

  it('MJ-12: the post-incident money follows the incident and the months left', () => {
    const state = quiet('scaled-money', 60)
    const minor = { consequence: 0.05 } as never
    const severe = { consequence: 0.8 } as never
    expect(scaledPostIncidentAmount(state, 400, severe)).toBeGreaterThan(scaledPostIncidentAmount(state, 400, minor))
    const early = scaledPostIncidentAmount(state, 400, severe)
    state.currentDay = 300
    expect(scaledPostIncidentAmount(state, 400, severe)).toBeLessThan(early)
  })

  it('MJ-23 and MJ-26: the SOC renewal, the test scope and the overload each have a free option', () => {
    for (const [decision, option] of [['dec-soc-contract', 'opt-soc-measure'], ['dec-pentest-scope', 'opt-pentest-swap'], ['dec-team-overload', 'opt-overload-defer']]) {
      const def = index.decision.get(decision)!
      const free = def.options.find((o) => o.id === option)!
      expect(free.immediateEffects.some((e) => e.type === 'budget.change')).toBe(false)
    }
  })

  it('MN-45: notifying the regulator and restating the figure do not cost board confidence', () => {
    for (const option of ['opt-extortion-notify', 'opt-tidy-restate']) {
      const def = index.content.decisions.find((d) => d.options.some((o) => o.id === option))!
      const effects = def.options.find((o) => o.id === option)!.immediateEffects
      expect(effects.filter((e) => e.type === 'board.confidence' && e.delta < 0)).toEqual([])
    }
  })

  it('MN-50: raising a named concern takes attention', () => {
    const state = quiet('raise-costs')
    const emerging = Object.values(state.risks.scenarios).find((s) => s.status === 'emerging')!
    state.resources.focusRemaining = 0
    expect(applyAction(state, index, { type: 'openRisk', scenarioId: emerging.id }).ok).toBe(false)
    state.resources.focusRemaining = 2
    expect(applyAction(state, index, { type: 'openRisk', scenarioId: emerging.id }).ok).toBe(true)
    expect(state.resources.focusRemaining).toBe(1)
  })

  it('MJ-09: a paper that recommends nothing is told so', () => {
    const state = quiet('reply-reads')
    const decision = openDecision(state, index, 'dec-legacy-retirement')!
    applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-legacy-accept', rationaleTagIds: ['rat-retirement'] })
    state.currentDay = 91
    const topic = Object.keys(state.risks.scenarios).find((id) => state.risks.scenarios[id]!.status !== 'emerging')!
    const review = buildQuarterReview(state, index, { quarter: 1, topics: [`risk:${topic}`], recommendations: [], communicateUncertainty: true })
    expect(review.boardReaction).toContain('recommends nothing')
  })

  it('MJ-21: a year after the breach has an incident whatever the mode', () => {
    const state = newGame(index, { seed: 'breach-floor', difficulty: 'guided', situation: 'sit-after-breach' })
    expect(state.flags['situation.incident-floor-day']).toBe(240)
    runDays(state, index, 241)
    expect(Object.keys(state.incidents.incidents).length).toBeGreaterThan(0)
  })
})
