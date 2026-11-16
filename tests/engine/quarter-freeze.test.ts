import { expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { DAYS_PER_QUARTER } from '@/game/types'
import { testIndex } from './helpers'

// "A change freeze over the quarter close" held identity work for months,
// because only the player's action cleared it (f364f2e playtest, runs 6, 13).
const index = testIndex()

it('lifts the quarter-close freeze when the quarter closes', () => {
  const state = newGame(index, { seed: 'quarter-freeze' })
  expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 850 }).ok).toBe(true)
  state.currentDay = DAYS_PER_QUARTER - 5
  state.programmes.programmes['prog-identity']!.blockers.push({ id: 'blk-identity-exec', startedDay: state.currentDay, resolved: false })
  runDays(state, index, 6)
  const freeze = state.programmes.programmes['prog-identity']!.blockers.find((b) => b.id === 'blk-identity-exec')!
  expect(freeze.resolved).toBe(true)
  expect(state.history.entries.some((entry) => entry.summary.includes('lifted as the quarter closed'))).toBe(true)
})
