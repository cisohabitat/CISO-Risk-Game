import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { newGame } from '@/game/engine/orchestrator'
import { buildQuarterReview, materialTopics } from '@/game/debrief/quarter'

// 16fe0ee playtest (M-03): optional topics a player chose were dropped from
// the board's reply, and an assumption's own full stop printed "Q3..".
it('names the optional topics chosen, and never doubles a full stop', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'board-echo' })
  // One raised risk, rated low, so it is on the agenda as an optional item.
  const scenario = Object.values(state.risks.scenarios)[0]!
  scenario.status = 'open'
  scenario.lastAssessed = { ...(scenario.lastAssessed ?? {}), residual: 0.05, consequence: 0.05 } as never
  const topics = materialTopics(state, index)
  const material = topics.filter((t) => t.material).map((t) => t.id)
  const optional = topics.filter((t) => !t.material).slice(0, 1)
  expect(optional.length).toBe(1)
  const review = buildQuarterReview(state, index, { quarter: 1, topics: [...material, optional[0]!.id], recommendations: [], communicateUncertainty: true })
  expect(review.boardReaction).toContain(`It also noted: ${optional[0]!.label.replace(/\.$/, '')}.`)
  expect(review.boardReaction).not.toContain('..')
})
