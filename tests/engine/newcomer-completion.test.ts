import { expect, it } from 'vitest'
import { newGame, applyAction } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

it('holds Skip ahead before an existing decision without advancing time, RNG or its deadline', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'newcomer-existing-decision' })
  const decision = state.decisions.decisions[state.decisions.openIds[0]!]!
  decision.deadlineDay = state.currentDay + 1
  const day = state.currentDay
  const cursor = state.rngCursor
  const result = applyAction(state, index, { type: 'advance', days: 30, stopOnUpdate: true })
  expect(result.ok).toBe(true)
  expect(result.ticks).toEqual([])
  expect(state.currentDay).toBe(day)
  expect(state.rngCursor).toBe(cursor)
  expect(decision.resolvedDay).toBeUndefined()
  expect(state.pauseReasons).toContain('pending-decision')
  // Explicit ordinary time still permits deliberate waiting/defaults.
  applyAction(state, index, { type: 'advance', days: 2 })
  expect(state.currentDay).toBeGreaterThan(day)
})
