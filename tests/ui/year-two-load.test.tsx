// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { useGameStore } from '@/store/game-store'
import { runDays } from '@/game/engine/orchestrator'
import { finishYear } from '@/game/debrief/review'

// A first year opens without Year Two's content; a second year fetches it.
it('loads Year Two only when a second year begins', async () => {
  await useGameStore.getState().startNewGame('year-two-load', 'ciso')
  const firstIndex = useGameStore.getState().index!
  expect(firstIndex.decision.has('dec-y2-focus')).toBe(false)

  const state = structuredClone(useGameStore.getState().state!)
  runDays(state, firstIndex, 364)
  finishYear(state, firstIndex)
  useGameStore.setState({ state })
  await useGameStore.getState().beginNextYear()

  expect(useGameStore.getState().state!.year).toBe(2)
  expect(useGameStore.getState().index!.decision.has('dec-y2-focus')).toBe(true)
  // Once there, it stays: a new first year runs under the full index.
  await useGameStore.getState().startNewGame('year-two-after', 'ciso')
  expect(useGameStore.getState().index!.decision.has('dec-y2-focus')).toBe(true)
}, 60_000)
