// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useGameClock } from '@/components/game/useGameClock'
import { useGameStore } from '@/store/game-store'

function Clock() { useGameClock(); return null }
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('ignores a queued interval callback after the engine has paused', async () => {
  await useGameStore.getState().startNewGame('stale-clock', 'guided')
  useGameStore.getState().dispatch({ type: 'setSpeed', speed: '4x' })
  let tick: () => void = () => { throw new Error('No timer installed') }
  vi.spyOn(window, 'setInterval').mockImplementation((callback) => { tick = callback as () => void; return 1 })
  render(<Clock />)
  const day = useGameStore.getState().state!.currentDay
  // Invoke before React can clean the old timer: this is a queued browser task.
  act(() => {
    useGameStore.getState().dispatch({ type: 'setSpeed', speed: 'paused' })
    tick()
  })
  expect(useGameStore.getState().state!.currentDay).toBe(day)
})
it('does not advance behind a modal reader and requires a deliberate resume', async () => {
  await useGameStore.getState().startNewGame('reading-clock', 'guided')
  useGameStore.getState().dispatch({ type: 'setSpeed', speed: '4x' })
  let tick: () => void = () => { throw new Error('No timer installed') }
  vi.spyOn(window, 'setInterval').mockImplementation((callback) => { tick = callback as () => void; return 1 })
  render(<><Clock /><div role="dialog" aria-modal="true">Reading</div></>)
  const day = useGameStore.getState().state!.currentDay
  act(() => tick())
  expect(useGameStore.getState().state!.currentDay).toBe(day)
  expect(useGameStore.getState().state!.paused).toBe(true)
})
it('pauses when the player hides the tab instead of spending reading time', async () => {
  await useGameStore.getState().startNewGame('hidden-clock', 'guided')
  useGameStore.getState().dispatch({ type: 'setSpeed', speed: '4x' })
  vi.spyOn(window, 'setInterval').mockImplementation(() => 1)
  render(<Clock />)
  const day = useGameStore.getState().state!.currentDay
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(useGameStore.getState().state!.paused).toBe(true)
  expect(useGameStore.getState().state!.currentDay).toBe(day)
})
it('ignores a stale callback from a different campaign even at the same speed', async () => {
  await useGameStore.getState().startNewGame('old-clock', 'guided')
  useGameStore.getState().dispatch({ type: 'setSpeed', speed: '4x' })
  let tick: () => void = () => { throw new Error('No timer installed') }
  vi.spyOn(window, 'setInterval').mockImplementation((callback) => { tick = callback as () => void; return 1 })
  render(<Clock />)
  const stale = tick
  await act(async () => {
    await useGameStore.getState().startNewGame('new-clock', 'guided')
    useGameStore.getState().dispatch({ type: 'setSpeed', speed: '4x' })
  })
  const day = useGameStore.getState().state!.currentDay
  act(() => stale())
  expect(useGameStore.getState().state!.currentDay).toBe(day)
  expect(useGameStore.getState().state!.speed).toBe('4x')
})
