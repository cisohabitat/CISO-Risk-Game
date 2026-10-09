import { describe, expect, it } from 'vitest'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { checkInvariants } from '@/game/engine/invariants'
import { testIndex } from './helpers'

/**
 * Phase 5 of docs/ROADMAP.md: a performance budget held in CI, not by hand.
 * Measured on 9 October 2026: a simulated day takes about 0.17ms (0.33ms at
 * worst over fifteen years), and the invariant check every save now runs
 * takes 0.08ms. The limits are about ten times that, so a slower runner
 * passes and a real regression does not.
 */
const index = testIndex()

describe('the engine stays cheap', () => {
  it('simulates a day in well under a frame', () => {
    const perDay: number[] = []
    for (const seed of ['perf-a', 'perf-b', 'perf-c']) {
      const state = newGame(index, { seed })
      const start = performance.now()
      runDays(state, index, 364)
      perDay.push((performance.now() - start) / 364)
    }
    expect(Math.max(...perDay), `ms per day: ${perDay.map((ms) => ms.toFixed(3)).join(', ')}`).toBeLessThan(2)
  })

  it('checks a save before writing it without the player noticing', () => {
    const state = newGame(index, { seed: 'perf-check' })
    runDays(state, index, 200)
    const start = performance.now()
    for (let n = 0; n < 20; n += 1) checkInvariants(state, index)
    expect((performance.now() - start) / 20).toBeLessThan(5)
  })
})
