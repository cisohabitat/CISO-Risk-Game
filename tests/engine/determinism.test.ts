import { describe, expect, it } from 'vitest'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { assertSerialisable } from '@/game/engine/invariants'
import { testIndex } from './helpers'

describe('determinism', () => {
  it('produces identical state history for the same seed', () => {
    const index = testIndex()
    const a = newGame(index, { seed: 'determinism-1' })
    const b = newGame(index, { seed: 'determinism-1' })
    runDays(a, index, 200)
    runDays(b, index, 200)
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b))
  })

  it('produces materially different worlds for different seeds', () => {
    const index = testIndex()
    const a = newGame(index, { seed: 'alpha' })
    const b = newGame(index, { seed: 'beta' })
    runDays(a, index, 364)
    runDays(b, index, 364)
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })

  it('resumes identically from a serialised save', () => {
    const index = testIndex()
    const original = newGame(index, { seed: 'resume-seed' })
    runDays(original, index, 120)
    const snapshot = JSON.parse(JSON.stringify(original))
    runDays(original, index, 80)
    runDays(snapshot, index, 80)
    expect(JSON.stringify(snapshot)).toEqual(JSON.stringify(original))
  })

  it('keeps state serialisable throughout a campaign', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'serialise' })
    for (let i = 0; i < 12; i += 1) {
      runDays(state, index, 30)
      assertSerialisable(state)
    }
  })

  it('runs a full year headlessly', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'full-year' })
    // A new campaign already sits on day 1: the player arrives mid-morning.
    expect(state.currentDay).toBe(1)
    const ticks = runDays(state, index, 400)
    expect(ticks.length).toBe(363)
    expect(state.currentDay).toBe(364)
    expect(ticks[ticks.length - 1]?.yearEnded).toBe(true)
  })
})
