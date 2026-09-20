import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays, optionBudgetCost } from '@/game/engine/orchestrator'
import { checkInvariants } from '@/game/engine/invariants'
import { openDecisions } from '@/store/selectors'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * Spending has to mean something.
 *
 * Fifteen authored options carry a price and not one declared
 * `requirements.budget`, so the affordability gate never ran for a decision and
 * the floor on `budget.change` quietly absorbed the difference: £320k of
 * emergency response could be taken with £100k left, the benefit applied in
 * full, and the missing £220k appeared nowhere. A player who kept a reserve
 * finished level with one who had not.
 */

/** Opens a decision directly, so a test does not have to wait for the draw. */
function openDecision(state: GameState, index: ReturnType<typeof testIndex>, defId: string): string {
  const id = `${defId}#test`
  state.decisions.decisions[id] = {
    id,
    defId,
    createdDay: state.currentDay,
    deadlineDay: state.currentDay + 7,
    resolvedByDefault: false,
    rationaleTagIds: [],
    assumptionIds: [],
  }
  state.decisions.openIds.push(id)
  void index
  return id
}

describe('funding', () => {
  it('prices every option from its own effects', () => {
    const index = testIndex()
    const def = index.decision.get('dec-inc-external')!
    const buy = def.options.find((o) => o.id === 'opt-inc-ext-yes')!
    expect(optionBudgetCost(buy)).toBe(320)
    expect(optionBudgetCost(def.options.find((o) => o.id === 'opt-inc-ext-no')!)).toBe(0)
  })

  it('refuses a discretionary purchase the year cannot pay for', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'fund-1' })
    const id = openDecision(state, index, 'dec-team-overload')
    state.resources.budgetRemaining = 50 // the option costs 200

    const result = applyAction(state, index, {
      type: 'resolveDecision',
      decisionId: id,
      optionId: 'opt-overload-buy',
      rationaleTagIds: [],
    })

    expect(result.ok).toBe(false)
    expect(result.message).toContain('£200k')
    // Nothing applied: no benefit without the money.
    expect(state.resources.budgetRemaining).toBe(50)
    expect(state.decisions.openIds).toContain(id)
  })

  it('lets emergency spend exceed the year, and records the shortfall', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'fund-2' })
    const id = openDecision(state, index, 'dec-inc-external')
    state.resources.budgetRemaining = 100 // the engagement costs 320

    const result = applyAction(state, index, {
      type: 'resolveDecision',
      decisionId: id,
      optionId: 'opt-inc-ext-yes',
      rationaleTagIds: [],
    })

    expect(result.ok).toBe(true)
    expect(state.resources.budgetRemaining).toBe(0)
    // The £220k it could not meet is carried, not absorbed by the floor.
    expect(state.resources.unfundedCommitment).toBe(220)
    expect(checkInvariants(state, index)).toEqual([])
  })

  it('records no shortfall when an emergency is affordable', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'fund-3' })
    const id = openDecision(state, index, 'dec-inc-external')
    state.resources.budgetRemaining = 400

    applyAction(state, index, {
      type: 'resolveDecision',
      decisionId: id,
      optionId: 'opt-inc-ext-yes',
      rationaleTagIds: [],
    })

    expect(state.resources.budgetRemaining).toBe(80)
    expect(state.resources.unfundedCommitment).toBe(0)
  })

  it('takes an imposed cut down to zero without calling it a debt', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'fund-4' })
    const id = openDecision(state, index, 'dec-budget-reallocation')
    state.resources.budgetRemaining = 90 // finance asks for 220

    const result = applyAction(state, index, {
      type: 'resolveDecision',
      decisionId: id,
      optionId: 'opt-budget-give',
      rationaleTagIds: ['rat-more-evidence'],
    })

    // Money taken from you is never refused, and what is not there is not taken.
    expect(result.ok).toBe(true)
    expect(state.resources.budgetRemaining).toBe(0)
    expect(state.resources.unfundedCommitment).toBe(0)
  })

  it('puts the price on the card rather than an adjective', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'fund-5' })
    openDecision(state, index, 'dec-inc-external')
    const view = openDecisions(state, index).find((d) => d.defId === 'dec-inc-external')!
    const buy = view.options.find((o) => o.id === 'opt-inc-ext-yes')!

    expect(buy.budgetCost).toBe(320)
    expect(buy.visibleKnownEffects.join(' ')).not.toContain('Expensive')
  })

  it('warns before an overspend rather than after it', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'fund-6' })
    openDecision(state, index, 'dec-inc-external')
    state.resources.budgetRemaining = 100
    const view = openDecisions(state, index).find((d) => d.defId === 'dec-inc-external')!
    const buy = view.options.find((o) => o.id === 'opt-inc-ext-yes')!

    expect(buy.exceedsBudget).toBe(true)
    // Emergency support stays available; it is the shortfall that is recorded.
    expect(buy.affordable).toBe(true)
  })

  it('never leaves the budget negative across a campaign', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'fund-7' })
    for (let i = 0; i < 13; i += 1) {
      runDays(state, index, 28)
      expect(state.resources.budgetRemaining).toBeGreaterThanOrEqual(0)
      expect(checkInvariants(state, index)).toEqual([])
    }
  })
})
