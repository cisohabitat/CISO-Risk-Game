import { describe, expect, it } from 'vitest'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { discoveredNodes } from '@/store/selectors'
import { testIndex } from './helpers'

/**
 * The rule the whole design rests on: the graph the simulation reasons about is
 * not the graph the player sees.
 *
 * It was previously guarded only by an end-to-end assertion that one named
 * system does not appear on the Organisation screen, which would miss a leak of
 * any other node, and by an engine invariant that checks the opposite direction
 * (a discovered node must exist). This checks the selector itself, across a
 * whole campaign, for every node and every dependency it emits.
 */
describe('hidden truth stays hidden', () => {
  it('never lets an undiscovered node or dependency reach the view layer', () => {
    const index = testIndex()
    for (const seed of ['hidden-1', 'hidden-2']) {
      const state = newGame(index, { seed })
      for (let day = 0; day < 364; day += 1) {
        if (day % 7 === 0) {
          for (const view of discoveredNodes(state, index)) {
            const node = state.organisation.nodes[view.id]
            expect(node?.exists, `${view.id} does not exist and was shown`).toBe(true)
            expect(node?.discovered, `${view.id} is undiscovered and was shown`).toBe(true)

            for (const dependency of [...view.dependencies, ...view.dependents]) {
              const other = state.organisation.nodes[dependency.id]
              expect(other?.exists, `${dependency.id} does not exist and was shown`).toBe(true)
              expect(
                other?.discovered,
                `${dependency.id} is undiscovered and was shown as a dependency of ${view.id}`,
              ).toBe(true)
            }
          }
        }
        runDays(state, index, 1)
      }
    }
  })

  it('shows more of the estate as the player discovers it, not from the start', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'hidden-3' })
    const atStart = discoveredNodes(state, index).length
    runDays(state, index, 364)
    const atEnd = discoveredNodes(state, index).length
    expect(atStart).toBeGreaterThan(0)
    expect(atEnd).toBeGreaterThanOrEqual(atStart)
    expect(atStart).toBeLessThan(index.content.nodes.length)
  })
})
