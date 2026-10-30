// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useGameClock } from '@/components/game/useGameClock'
import { useGameStore } from '@/store/game-store'

function Clock() { useGameClock(); return null }
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('holds fast time after spending attention and after a refused action', async () => {
  await useGameStore.getState().startNewGame('fast-actions', 'high-pressure')
  const store = useGameStore.getState()
  store.dispatch({ type: 'setSpeed', speed: '4x' })
  const focus = useGameStore.getState().state!.resources.focusRemaining
  expect(store.dispatch({ type: 'startProgramme', programmeId: 'prog-identity', budget: 850 }).ok).toBe(true)
  expect(useGameStore.getState().state!.resources.focusRemaining).toBeLessThan(focus)
  expect(useGameStore.getState().state!.speed).toBe('paused')
  store.dispatch({ type: 'setSpeed', speed: '2x' })
  const budget = useGameStore.getState().state!.resources.budgetRemaining
  expect(store.dispatch({ type: 'startProgramme', programmeId: 'prog-ransomware', budget: 1 }).ok).toBe(false)
  expect(useGameStore.getState().state!.paused).toBe(true)
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(budget)
})
it('holds at the next attention renewal rather than fast-forwarding across weeks', async () => {
  await useGameStore.getState().startNewGame('fast-week', 'high-pressure')
  const state = structuredClone(useGameStore.getState().state!)
  state.currentDay = 6
  state.resources.focusRemaining = 0
  useGameStore.setState({ state })
  useGameStore.getState().dispatch({ type: 'setSpeed', speed: '4x' })
  useGameStore.getState().advanceDays(30)
  const held = useGameStore.getState().state!
  expect(held.currentDay).toBe(7)
  expect(held.resources.focusRemaining).toBe(held.resources.focusPerWeek)
  expect(held.speed).toBe('paused')
  expect(useGameStore.getState().ui.toasts.some((toast) => toast.message.includes('A new week'))).toBe(true)
})
it('keeps normal speed and explicit speed selection under player control', async () => {
  await useGameStore.getState().startNewGame('normal-actions', 'high-pressure')
  const store = useGameStore.getState()
  store.dispatch({ type: 'setSpeed', speed: '1x' })
  store.dispatch({ type: 'markRead', messageId: useGameStore.getState().state!.inbox.messages[0]!.id })
  expect(useGameStore.getState().state!.speed).toBe('1x')
  store.dispatch({ type: 'setSpeed', speed: '4x' })
  expect(useGameStore.getState().state!.paused).toBe(false)
})
it('holds after submitting a board paper at high speed', async () => {
  await useGameStore.getState().startNewGame('fast-board', 'high-pressure')
  const state = structuredClone(useGameStore.getState().state!)
  state.currentDay = 91
  state.reviews.pendingQuarter = 1
  useGameStore.setState({ state })
  useGameStore.getState().dispatch({ type: 'setSpeed', speed: '4x' })
  expect(useGameStore.getState().dispatch({ type: 'completeQuarterReview', quarter: 1, topics: [], recommendations: [], communicateUncertainty: true }).ok).toBe(true)
  expect(useGameStore.getState().state!.paused).toBe(true)
})
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
