import { expect, it } from 'vitest'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { DAYS_PER_QUARTER } from '@/game/types'
import { testIndex } from './helpers'

// A paper submitted twice was recorded twice: two committee replies in the
// inbox and in the Board history, and its attention spent twice (practitioner
// and 15-run replay playtests, November).
const index = testIndex()

it('records a quarter\'s paper once, however often it is submitted', () => {
  const state = newGame(index, { seed: 'paper-once' })
  state.currentDay = DAYS_PER_QUARTER
  state.reviews.pendingQuarter = 1
  const paper = { type: 'completeQuarterReview' as const, quarter: 1, topics: [], recommendations: [], communicateUncertainty: true }
  expect(applyAction(state, index, paper).ok).toBe(true)
  const focus = state.resources.focusRemaining
  expect(applyAction(state, index, paper).ok).toBe(false)
  expect(state.reviews.quarters.filter((review) => review.quarter === 1)).toHaveLength(1)
  expect(state.inbox.messages.filter((message) => message.subject === 'The committee on your Q1 paper')).toHaveLength(1)
  expect(state.resources.focusRemaining).toBe(focus)
})
