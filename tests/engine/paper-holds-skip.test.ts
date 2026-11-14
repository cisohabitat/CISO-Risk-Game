import { expect, it } from 'vitest'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { DAYS_PER_QUARTER } from '@/game/types'
import { testIndex } from './helpers'

// One 15-run playtest year (November) missed two board papers: Skip ahead
// paused once two days out, and the next Skip carried it past the deadline.
const index = testIndex()

function atDaysBeforeDeadline(days: number) {
  const state = newGame(index, { seed: `paper-skip-${days}` })
  state.decisions.openIds = []
  state.reviews.pendingQuarter = 2
  state.currentDay = 3 * DAYS_PER_QUARTER - 1 - days
  return state
}

it('holds Skip ahead in a paper\'s final week', () => {
  const state = atDaysBeforeDeadline(5)
  const result = applyAction(state, index, { type: 'advance', days: 7, stopOnUpdate: true })
  expect(result.message).toContain('the Q2 board paper is due in 5 days')
  expect(state.currentDay).toBe(3 * DAYS_PER_QUARTER - 6)
  expect(state.pauseReasons).toEqual(['board-decision'])
})

it('lets Skip run while the deadline is further off, and a chosen speed run past it', () => {
  const early = atDaysBeforeDeadline(30)
  applyAction(early, index, { type: 'advance', days: 7, stopOnUpdate: true })
  expect(early.currentDay).toBeGreaterThan(3 * DAYS_PER_QUARTER - 31)
  const late = atDaysBeforeDeadline(2)
  applyAction(late, index, { type: 'advance', days: 3 })
  expect(late.currentDay).toBeGreaterThan(3 * DAYS_PER_QUARTER - 3)
})
