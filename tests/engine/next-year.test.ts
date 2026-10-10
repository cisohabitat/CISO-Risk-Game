import { describe, expect, it } from 'vitest'
import { applyAction, beginNextYear, newGame, runDays } from '@/game/engine/orchestrator'
import { createNextYear, nextYearBudget, YEAR_SHIFT } from '@/game/engine/next-year'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { checkInvariants } from '@/game/engine/invariants'
import { buildAnnualReview, finishYear, programmesThisYear } from '@/game/debrief/review'
import { evaluateCondition } from '@/game/events/conditions'
import { CAMPAIGN_DAYS, type GameState } from '@/game/types'
import { testIndex } from './helpers'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'

function applyEffectsForTest(state: GameState, evidenceId: string): void {
  applyEffects(state, [{ type: 'evidence.reveal', evidenceId }], { index: testIndex(), rng: createRng(state.seed, 1), source: 'test' })
}

/**
 * A year that follows another (src/game/engine/next-year.ts): the same
 * organisation carried over, with a new year's inbox, plans and budget, and
 * last year's choices remembered for the content that answers them.
 */
const index = testIndex()

/** A year played with a light hand: the first option on everything, one programme, every board paper. */
function playYear(state: GameState): GameState {
  for (let day = state.currentDay; day < CAMPAIGN_DAYS; day += 1) {
    for (const id of [...state.decisions.openIds]) {
      const def = index.decision.get(state.decisions.decisions[id]!.defId)!
      for (const option of def.options) {
        const done = applyAction(state, index, {
          type: 'resolveDecision', decisionId: id, optionId: option.id,
          rationaleTagIds: def.rationaleTagIds?.slice(0, 1) ?? [],
        })
        if (done.ok) break
      }
    }
    if (day === 20 && state.programmes.programmes['prog-identity']?.status === 'proposed') {
      applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: index.programme.get('prog-identity')!.budgetCost })
    }
    if (state.reviews.pendingQuarter !== undefined) {
      applyAction(state, index, {
        type: 'completeQuarterReview', quarter: state.reviews.pendingQuarter, topics: [], recommendations: [], communicateUncertainty: true,
      })
    }
    runDays(state, index, 1)
  }
  finishYear(state, index)
  return state
}

const first = playYear(newGame(index, { seed: 'next-year', difficulty: 'ciso', situation: 'sit-inherited-mess' }))
const second = beginNextYear(index, first)
/** The same year before its first day has run, for comparing what carried. */
const carriedOver = createNextYear(index, first)

describe('a year that follows another', () => {
  it('is a campaign of its own, on the same seed, and passes the engine’s checks', () => {
    expect(second.year).toBe(2)
    expect(second.seed).toBe(first.seed)
    expect(second.gameId).not.toBe(first.gameId)
    expect(second.finished).toBe(false)
    expect(second.situationId).toBeUndefined()
    expect(checkInvariants(second, index)).toEqual([])
    // The finished year is not touched: its save stays as it was.
    expect(first.finished).toBe(true)
    expect(first.year).toBeUndefined()
  })

  it('is the same next year every time from the same finished one', () => {
    const again = beginNextYear(index, first)
    expect(JSON.stringify(again)).toBe(JSON.stringify(second))
  })

  it('carries the organisation as the player left it', () => {
    for (const [id, node] of Object.entries(first.organisation.nodes)) {
      expect(carriedOver.organisation.nodes[id]!.discovered, id).toBe(node.discovered)
      expect(carriedOver.organisation.nodes[id]!.exposure, id).toBe(node.exposure)
    }
    for (const [id, control] of Object.entries(first.controls.controls)) {
      expect(carriedOver.controls.controls[id]!.coverage, id).toBe(control.coverage)
    }
    expect(Object.keys(carriedOver.risks.scenarios).sort()).toEqual(Object.keys(first.risks.scenarios).sort())
  })

  it('carries last year’s evidence as last year’s, without what only described the year the player arrived', () => {
    // A second year opened with all 49 of the first year's findings dated
    // "1 Jan" and unread, among them "Exploit published … this week" and
    // "Platform launch date is fixed and public" (second-year AI playtest).
    const kept = Object.keys(carriedOver.evidence.items)
    expect(kept.length).toBeGreaterThan(0)
    expect(kept.length).toBeLessThan(Object.keys(first.evidence.items).length)
    for (const id of kept) {
      expect(first.evidence.items[id], id).toBeDefined()
      expect(carriedOver.evidence.items[id]!.read, id).toBe(true)
      expect(carriedOver.evidence.items[id]!.discoveredDay, id).toBeLessThan(0)
    }
    for (const id of ['ev-launch-pressure', 'ev-exploit-available', 'ev-audit-stale-register', 'ev-kestrel-unknown']) {
      if (first.evidence.items[id]) expect(kept, id).not.toContain(id)
    }
    expect(carriedOver.evidence.order.sort()).toEqual([...kept].sort())
    // An enquiry that finds one again this year makes it this year's.
    const again = kept[0]!
    const year = JSON.parse(JSON.stringify(carriedOver)) as GameState
    applyEffectsForTest(year, again)
    expect(year.evidence.items[again]!.discoveredDay).toBe(year.currentDay)
    expect(year.evidence.order[0]).toBe(again)
  })

  it('keeps what was built, and does not count it as this year’s work', () => {
    const identity = first.programmes.programmes['prog-identity']!
    expect(identity.status).not.toBe('proposed')
    const carried = carriedOver.programmes.programmes['prog-identity']!
    expect(carried.status).toBe(identity.status)
    expect(carried.progress).toBe(identity.progress)
    expect(carried.startedDay).toBe(identity.startedDay! - YEAR_SHIFT)
    if (identity.status === 'complete') {
      expect(programmesThisYear(second).map((p) => p.id)).not.toContain('prog-identity')
    } else {
      expect(programmesThisYear(second).map((p) => p.id)).toContain('prog-identity')
    }
  })

  it('starts the year’s own things again', () => {
    expect(second.decisions.openIds.length + second.decisions.resolvedIds.length).toBeLessThanOrEqual(2)
    expect(second.incidents.order).toEqual([])
    expect(second.reviews.quarters).toEqual([])
    expect(second.reviews.annual).toBeUndefined()
    expect(second.currentDay).toBe(1)
    // The business has a new year's plans, and only those.
    const objectives = Object.keys(second.business.objectives)
    expect(objectives.length).toBeGreaterThan(0)
    for (const id of objectives) expect(index.objective.get(id)?.year, id).toBe(2)
    // Counters carry, so no id is used twice across the years.
    expect(second.inbox.counter).toBeGreaterThanOrEqual(first.inbox.counter)
    const firstIds = new Set(first.inbox.messages.map((m) => m.id))
    for (const message of second.inbox.messages) expect(firstIds.has(message.id), message.id).toBe(false)
  })

  it('does not say the first year again, and opens on the second', () => {
    const fired = second.inbox.messages.map((m) => m.eventId)
    expect(fired).toContain('evt-y2-opening')
    expect(fired).not.toContain('evt-day-one')
    expect(second.inbox.messages.some((m) => m.subject === 'Your first day')).toBe(false)
    // Something the first year already said stays said.
    for (const id of first.events.firedEventIds) expect(second.events.firedEventIds).toContain(id)
  })

  it('remembers last year for the content that answers it', () => {
    const record = second.previousYears!.at(-1)!
    expect(record.year).toBe(1)
    expect(record.headline).toBe(first.reviews.annual!.headline)
    expect(record.situationId).toBe('sit-inherited-mess')
    const [defId, optionId] = Object.entries(record.decisions)[0]!
    expect(evaluateCondition(second, index, { kind: 'lastYear.optionTaken', decisionId: defId, optionId })).toBe(true)
    expect(evaluateCondition(second, index, { kind: 'lastYear.optionTaken', decisionId: defId, optionId: 'not-an-option' })).toBe(false)
    expect(evaluateCondition(second, index, { kind: 'campaign.yearAtLeast', year: 2 })).toBe(true)
    expect(evaluateCondition(first, index, { kind: 'campaign.yearAtLeast', year: 2 })).toBe(false)
    const band = first.reviews.annual!.dimensions[0]!
    expect(evaluateCondition(second, index, { kind: 'lastYear.dimensionBand', dimensionId: band.id, band: band.band })).toBe(true)
    expect(evaluateCondition(second, index, { kind: 'lastYear.incidentsAtLeast', value: first.incidents.order.length })).toBe(true)
    expect(evaluateCondition(second, index, { kind: 'lastYear.incidentsAtLeast', value: first.incidents.order.length + 1 })).toBe(false)
  })

  it('sets the budget on the line the autumn agreed', () => {
    const standing = index.content.meta.startingBudget * DIFFICULTY_PROFILES.ciso.budgetMultiplier
    for (const [decided, share] of [['cut', 0.8], ['trimmed', 0.9], ['held', 1]] as const) {
      const year = JSON.parse(JSON.stringify(first)) as GameState
      year.flags['next-year.budget'] = decided
      year.resources.unfundedCommitment = 0
      expect(nextYearBudget(year, index), decided).toBe(Math.round(standing * share))
    }
    // Last year's emergency spend is this year's first call on the line, and a letter says so.
    const owing = JSON.parse(JSON.stringify(first)) as GameState
    delete owing.flags['next-year.budget']
    owing.resources.unfundedCommitment = 100
    const next = beginNextYear(index, owing)
    expect(next.resources.budgetTotal).toBe(Math.round(standing - 100))
    runDays(next, index, 3)
    expect(next.inbox.messages.map((m) => m.eventId)).toContain('evt-y2-budget-owed')
  })

  it('carries an acceptance to the date it was given, with the assumptions behind it', () => {
    const year = JSON.parse(JSON.stringify(first)) as GameState
    const scenario = Object.values(year.risks.scenarios)[0]!
    scenario.status = 'accepted'
    scenario.acceptedUntilDay = 400
    year.assumptions.assumptions['carried'] = {
      id: 'carried', defId: 'asm-mfa-admins', statement: 'x', createdDay: 300, linkedScenarioIds: [scenario.id],
      linkedNodeIds: [], status: 'valid', heldWhenRecorded: true, acknowledged: false, linkedDecisionId: 'gone',
    }
    year.assumptions.assumptions['dropped'] = {
      id: 'dropped', defId: 'asm-mfa-admins', statement: 'y', createdDay: 300, linkedScenarioIds: [],
      linkedNodeIds: [], status: 'valid', heldWhenRecorded: true, acknowledged: false,
    }
    scenario.assumptionIds = ['carried', 'dropped']
    const next = createNextYear(index, year)
    const carried = next.risks.scenarios[scenario.id]!
    expect(carried.status).toBe('accepted')
    expect(carried.acceptedUntilDay).toBe(400 - YEAR_SHIFT)
    expect(carried.assumptionIds).toEqual(['carried'])
    expect(next.assumptions.assumptions['carried']!.linkedDecisionId).toBeUndefined()
    expect(next.assumptions.assumptions['dropped']).toBeUndefined()
    expect(evaluateCondition(next, index, { kind: 'risk.acceptedCountAtLeast', value: 1 })).toBe(true)
  })

  it('plays a whole second year without breaking, and the review knows which year it was', () => {
    const played = playYear(beginNextYear(index, first))
    expect(checkInvariants(played, index)).toEqual([])
    const review = buildAnnualReview(played, index)
    expect(review.performanceBand).toMatch(/second year$/)
    expect(review.narrative.join(' ')).toContain('Last year the review called it')
    // And a third follows a second.
    const third = beginNextYear(index, played)
    expect(third.year).toBe(3)
    expect(third.previousYears!.map((y) => y.year)).toEqual([1, 2])
    expect(checkInvariants(third, index)).toEqual([])
  })

  it('cannot follow a year that has not finished', () => {
    expect(() => createNextYear(index, newGame(index, { seed: 'unfinished' }))).toThrow()
  })

  it('leaves a first year exactly as it was: no later plans, no later content', () => {
    const fresh = newGame(index, { seed: 'next-year' })
    expect(Object.keys(fresh.business.objectives).every((id) => (index.objective.get(id)?.year ?? 1) === 1)).toBe(true)
    expect(first.inbox.messages.some((m) => m.eventId?.startsWith('evt-y2-'))).toBe(false)
  })
})
