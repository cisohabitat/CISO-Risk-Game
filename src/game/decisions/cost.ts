/**
 * What an option costs, and what an imposed cut actually takes and earns.
 */
import type { DecisionOptionDef, GameEffect, GameState } from '../types'
import { round2 } from '../types'

/**
 * What an option costs, read from the option itself.
 *
 * The price is authored once, as the negative `budget.change` the reducer will
 * apply, so a gate derived from it cannot drift from what actually gets spent.
 * Deriving it also means every priced option is covered: none of the fifteen
 * carrying a cost had ever declared `requirements.budget`, so the affordability
 * gate was dead for decisions and the floor on `budget.change` silently ate the
 * difference — you could take £320k of emergency response with £100k left, keep
 * the whole benefit, and the missing £220k appeared nowhere.
 */
export function optionBudgetCost(option: DecisionOptionDef): number {
  let cost = 0
  for (const effect of option.immediateEffects) {
    if (effect.type === 'budget.change' && effect.amount < 0) cost -= effect.amount
  }
  return round2(cost)
}

/** What an imposed cut will actually take: the price, or what is left. */
export function imposedTake(state: GameState, option: DecisionOptionDef): number {
  return round2(Math.min(optionBudgetCost(option), Math.max(0, state.resources.budgetRemaining)))
}

/**
 * The effects an option applies. Money taken from you is never refused, and
 * what is not there is not taken; but the credit for giving it was taken in
 * full. Finance's £220k request met most players with less than that left, so
 * "Give it up" handed over whatever remained and earned the whole of the CFO's
 * thanks, and with under £110k left the smaller, named contribution cost the
 * same and earned less. An imposed option's goodwill and progress now scale
 * with the share actually given.
 */
export function effectsAsPaid(state: GameState, option: DecisionOptionDef): GameEffect[] {
  if ((option.budgetTreatment ?? 'discretionary') !== 'imposed') return option.immediateEffects
  const asked = optionBudgetCost(option)
  if (asked <= 0 || state.resources.budgetRemaining >= asked) return option.immediateEffects
  const share = imposedTake(state, option) / asked
  const scaled: GameEffect[] = []
  for (const effect of option.immediateEffects) {
    if ((effect.type === 'stakeholder.trust' || effect.type === 'objective.progress') && effect.delta > 0) {
      if (share > 0) scaled.push({ ...effect, delta: effect.delta * share })
      continue
    }
    scaled.push(effect)
  }
  return scaled
}
