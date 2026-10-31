import { expect, it } from 'vitest'
import { newGame } from '@/game/engine/orchestrator'
import { objectivePace } from '@/game/business/pace'
import { testIndex } from './helpers'

const index = testIndex()
it('warns about a modest projected miss using observed progress without changing the world', () => {
  const state = newGame(index, { seed: 'public-pace' })
  state.currentDay = 155
  const objective = state.business.objectives['obj-platform-launch']!
  objective.status = 'active'; objective.progress = 0.85
  const before = JSON.stringify(state)
  expect(objectivePace(state, index, objective.id)).toMatchObject({ atRisk: true, daysRemaining: 20 })
  expect(JSON.stringify(state)).toBe(before)
  const expected = objectivePace(state, index, objective.id)
  for (const id of Object.keys(state.business.serviceHealth)) state.business.serviceHealth[id] = 0
  expect(objectivePace(state, index, objective.id)).toEqual(expected)
  objective.progress = 0.98
  expect(objectivePace(state, index, objective.id)?.atRisk).toBe(false)
})
it('does not forecast before a week of delivery, after expiry, or over recorded outcomes', () => {
  const state = newGame(index, { seed: 'pace-limits' })
  const objective = state.business.objectives['obj-platform-launch']!
  objective.status = 'active'
  state.currentDay = 22
  expect(objectivePace(state, index, objective.id)).toBeUndefined()
  state.currentDay = 155
  objective.status = 'achieved'
  expect(objectivePace(state, index, objective.id)).toBeUndefined()
  objective.status = 'active'; state.currentDay = objective.targetDay
  expect(objectivePace(state, index, objective.id)).toBeUndefined()
})
