import { money, type GameState } from '../types'

/** Record the actual bounded movement; an authored price is not a transaction. */
export function recordBudgetMovement(state: GameState, before: number, label: string): void {
  const after = state.resources.budgetRemaining
  const delta = Math.round((after - before) * 100) / 100
  if (delta === 0) return
  state.history.entries.push({
    day: state.currentDay,
    kind: 'budget',
    summary: `${label}: ${money(Math.abs(delta))} ${delta > 0 ? 'returned or added' : 'spent or withdrawn'}; ${money(after)} available (was ${money(before)}).`,
  })
}
