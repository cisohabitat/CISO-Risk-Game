import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { createIncident } from '@/game/incidents/create'
import { buildAnnualReview } from '@/game/debrief/review'
import { effortAllocation } from '@/game/debrief/prioritisation'
import { incidentCommands } from '@/store/selectors'
import { money } from '@/game/types'

// The 80611b8 playtest (pass 9): docs/playtests/2026-11-24-owner-supplied-80611b8-matrix.md.
const index = testIndex()

describe('80611b8 playtest fixes', () => {
  it('runs every security check, even for an objective idle delivery would have finished first (MJ-03)', () => {
    // Idle delivery finished the Kestrel join on day 206 and the Nordic
    // launch on day 230, before their checks on days 230 and 235.
    const state = newGame(index, { seed: 'nexora-96288', difficulty: 'guided', situation: 'sit-new-money' })
    runDays(state, index, 364)
    for (const def of index.content.objectives) {
      if (!def.gate || !state.business.objectives[def.id]) continue
      expect(state.business.objectives[def.id]!.gate, def.id).toBeDefined()
    }
  })

  it('never opens a second incident of a kind already being handled (MJ-13)', () => {
    // dup-29 on High pressure opened two targeted data thefts eight days apart.
    const state = newGame(index, { seed: 'dup-29', difficulty: 'high-pressure', situation: 'sit-after-breach' })
    for (let day = 0; day < 364 && !state.finished; day += 1) {
      for (const id of [...state.decisions.openIds]) {
        const def = index.decision.get(state.decisions.decisions[id]!.defId)!
        for (const option of [...def.options].reverse()) {
          if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: def.rationaleTagIds?.slice(0, 1) ?? [] }).ok) break
        }
      }
      if (state.reviews.pendingQuarter !== undefined) {
        applyAction(state, index, { type: 'completeQuarterReview', quarter: state.reviews.pendingQuarter, topics: [], recommendations: [], communicateUncertainty: false })
      }
      const open = Object.values(state.incidents.incidents).filter((i) => i.phase !== 'closed' && i.phase !== 'debrief')
      expect(new Set(open.map((i) => i.familyId)).size, `day ${state.currentDay}`).toBe(open.length)
      runDays(state, index, 1)
    }
  })

  it('shows every open incident, each with its own board briefing (MJ-14)', () => {
    const state = newGame(index, { seed: 'overlap' })
    createIncident(state, index, { familyId: 'fam-service-tampering' })
    createIncident(state, index, { familyId: 'fam-legacy-outage' })
    const views = incidentCommands(state, index)
    expect(views.map((v) => v.name)).toHaveLength(2)
    expect(new Set(views.map((v) => v.id)).size).toBe(2)
  })

  it('pays money that comes back against the unbudgeted spend first (MJ-11)', () => {
    const state = newGame(index, { seed: 'refund' })
    state.resources.budgetRemaining = 0
    state.resources.unfundedCommitment = 260
    applyEffects(state, [{ type: 'budget.change', amount: 400 }], { index, rng: createRng(state.seed, state.rngCursor), source: 'test' })
    expect(state.resources.unfundedCommitment).toBe(0)
    expect(state.resources.budgetRemaining).toBe(140)
    expect(state.history.entries.some((e) => e.summary.includes('paid against the unbudgeted spend'))).toBe(true)
  })

  it('costs communication a band for each further thing kept quiet (MJ-07)', () => {
    const state = newGame(index, { seed: 'quiet-two' })
    state.currentDay = 363
    state.stakeholders.boardConfidence = 0.95
    for (const quarter of [1, 2, 3]) state.reviews.quarters.push({ quarter, day: quarter * 91, topicsChosen: [], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    const band = () => buildAnnualReview(state, index).dimensions.find((d) => d.id === 'communication')!.band
    const quiet = (id: string, defId: string, optionId: string) => {
      state.decisions.decisions[id] = { id, defId, createdDay: 100, selectedOptionId: optionId, resolvedDay: 101, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [] }
    }
    quiet('q1', 'dec-cardholder-scope', 'opt-card-fix')
    expect(band()).toBe('solid')
    quiet('q2', 'dec-sit-tidy-numbers', 'opt-tidy-quiet')
    expect(band()).toBe('developing')
    quiet('q3', 'dec-inc-recall', 'opt-recall-absorb')
    expect(band()).toBe('weak')
  })

  it('credits a risk put in front of the board as something the year went near (MJ-06)', () => {
    const state = newGame(index, { seed: 'paper-credit' })
    const missed = effortAllocation(state, index).missed
    expect(missed).toBeDefined()
    state.reviews.quarters.push({ quarter: 1, day: 91, topicsChosen: [missed!.id], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    expect(effortAllocation(state, index).missed?.id).not.toBe(missed!.id)
  })

  it('shows a budget change that tenths of a million would hide (MN-01, CS-05)', () => {
    expect(money(3400)).toBe('£3.4m')
    expect(money(3460)).toBe('£3.46m')
    expect(money(2380)).toBe('£2.38m')
    expect(money(3000)).toBe('£3m')
    expect(money(60)).toBe('£60k')
  })
})
