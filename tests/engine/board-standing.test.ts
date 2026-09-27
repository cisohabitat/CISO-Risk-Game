import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview, materialTopics } from '@/game/debrief/review'
import type { GameState } from '@/game/types'
import { testIndex } from './helpers'

/**
 * The board's standing is on the home screen all year. Measured over 40
 * campaigns it read "Neutral" on 86-90% of days whatever the player did, and a
 * player who never wrote a paper ended the year where one who wrote every paper
 * did: confidence was pulled a percent a day towards the executives' average
 * trust, which itself drifts to the middle, and a missed paper cost nothing.
 */
const index = testIndex()

function fileIfDue(state: GameState): void {
  const quarter = state.reviews.pendingQuarter
  if (quarter === undefined) return
  state.resources.focusRemaining = Math.max(state.resources.focusRemaining, 3)
  const topics = materialTopics(state, index).filter((t) => t.material).map((t) => t.id)
  const result = applyAction(state, index, {
    type: 'completeQuarterReview',
    quarter,
    topics,
    recommendations: [],
    communicateUncertainty: true,
  })
  expect(result.ok).toBe(true)
}

function year(seed: string, file: boolean): GameState {
  const state = newGame(index, { seed })
  for (let day = 0; day < 364; day += 1) {
    if (file) fileIfDue(state)
    runDays(state, index, 1)
  }
  return state
}

describe('the board standing', () => {
  it('tells a year that went to the board from one that never did', () => {
    for (const seed of ['board-a', 'board-b', 'board-c']) {
      const filed = year(seed, true)
      const skipped = year(seed, false)
      expect(filed.stakeholders.boardConfidence - skipped.stakeholders.boardConfidence, seed).toBeGreaterThan(0.2)
      expect(filed.reviews.missedQuarters ?? 0).toBe(0)
      expect(skipped.reviews.missedQuarters).toBe(3)
    }
  })

  it('has the chair say so when the committee meets without a paper, and differently the second time', () => {
    const state = year('board-chair', false)
    const subjects = state.inbox.messages.map((m) => m.subject)
    expect(subjects.filter((s) => s === 'The committee met without your paper')).toHaveLength(1)
    // The third is missed on the last day, and the review says so instead.
    expect(subjects.filter((s) => s === 'Again, no paper')).toHaveLength(1)
    const evidence = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'communication')!.evidence
    expect(evidence).toContain('The committee met 3 times without a paper from you')
  })

  it('does not charge for a paper written late in the quarter', () => {
    const state = newGame(index, { seed: 'board-late' })
    runDays(state, index, 91 + 60)
    expect(state.reviews.pendingQuarter).toBe(1)
    fileIfDue(state)
    runDays(state, index, 40)
    expect(state.reviews.missedQuarters ?? 0).toBe(0)
    expect(state.inbox.messages.map((m) => m.subject)).not.toContain('The committee met without your paper')
  })

  it('remembers a good paper for a season, not a month', () => {
    const state = newGame(index, { seed: 'board-memory' })
    runDays(state, index, 91)
    const before = state.stakeholders.boardConfidence
    fileIfDue(state)
    const gained = state.stakeholders.boardConfidence - before
    expect(gained).toBeGreaterThan(0)
    runDays(state, index, 90)
    expect(state.stakeholders.boardConfidence - before).toBeGreaterThan(gained * 0.6)
  })
})
