// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { newGame } from '@/game/engine/orchestrator'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { GuidedExploration } from '@/components/game/GuidedProgress'
import { BudgetActivity } from '@/components/game/BriefingNotes'
import type { Difficulty } from '@/game/types'

beforeEach(async () => { await useGameStore.getState().startNewGame('ciso-four-scenarios', 'ciso') })
afterEach(cleanup)

it.each<Difficulty>(['ciso', 'high-pressure'])('caps one-shot skips in every workspace on %s', async (difficulty) => {
  await useGameStore.getState().startNewGame('ciso-skip-bound', difficulty)
  const store = useGameStore.getState()
  for (const workspace of ['home', 'risk', 'team', 'board'] as const) {
    const state = structuredClone(store.state!)
    state.currentDay = 147; state.resources.weekIndex = 21
    state.decisions.openIds = []; state.pendingEffects = []
    state.threats.actors = {}; state.threats.campaigns = []
    state.events.suppressedEventIds = store.index!.content.events.map((event) => event.id)
    for (const objective of Object.values(state.business.objectives)) objective.status = 'achieved'
    useGameStore.setState({ state })
    store.setScreen(workspace)
    const result = useGameStore.getState().dispatch({ type: 'advance', days: 50, stopOnUpdate: true })
    expect(result.ok).toBe(true)
    expect(useGameStore.getState().state!.currentDay - 147).toBeLessThanOrEqual(7)
    expect(useGameStore.getState().state!.speed).toBe('paused')
  }
})

it('does not close a replacement campaign when an earlier review import resolves', async () => {
  const store = useGameStore.getState()
  const pending = store.finishCampaign()
  expect(useGameStore.getState().state!.speed).toBe('paused')
  const replacement = newGame(store.index!, { seed: 'replacement-campaign' })
  useGameStore.setState({ state: replacement })
  await pending
  expect(useGameStore.getState().state).toBe(replacement)
  expect(replacement.finished).toBe(false)
  expect(replacement.reviews.annual).toBeUndefined()
})

it('requires acknowledgement for an empty paper and preserves the deliberate empty-paper reaction', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  state.currentDay = 91; state.reviews.pendingQuarter = 1
  state.incidents.incidents = {}; state.incidents.order = []
  state.assumptions.assumptions = {}
  for (const risk of Object.values(state.risks.scenarios)) risk.status = 'emerging'
  for (const fn of Object.values(state.team.functions)) fn.morale = 1
  useGameStore.setState({ state })
  render(<BoardScreen />)
  fireEvent.click(screen.getByRole('button', { name: /Prepare the Q1/ }))
  const paper = within(screen.getByRole('dialog'))
  const submit = paper.getByRole('button', { name: 'Take it to the board' })
  expect(submit).toBeDisabled()
  expect(useGameStore.getState().state!.reviews.quarters).toHaveLength(0)
  fireEvent.click(paper.getByRole('checkbox', { name: 'I intend to submit an empty paper.' }))
  expect(submit).toBeEnabled()
  fireEvent.click(submit)
  expect(useGameStore.getState().state!.reviews.quarters[0]!.boardReaction).toContain('nothing has yet been assessed')
})

it('offers an enquiry route for spare CISO attention and respects exhausted attention', () => {
  const state = structuredClone(useGameStore.getState().state!)
  state.currentDay = 35; state.resources.focusRemaining = 3
  useGameStore.setState({ state })
  const { rerender } = render(<GuidedExploration />)
  expect(screen.getByLabelText('Next checks')).toHaveTextContent('3 attention remains this week')
  fireEvent.click(screen.getByRole('button', { name: 'Choose the next enquiry' }))
  expect(useGameStore.getState().ui).toMatchObject({ screen: 'risk', riskTab: 'investigate' })
  useGameStore.setState({ state: { ...state, resources: { ...state.resources, focusRemaining: 0 } } })
  rerender(<GuidedExploration />)
  expect(screen.queryByLabelText('Next checks')).toBeNull()
})

it('announces a timed budget refund with its recorded source and opens the receipt', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  state.currentDay = 200; state.resources.weekIndex = 28
  state.decisions.openIds = []; state.threats.actors = {}; state.threats.campaigns = []
  state.events.suppressedEventIds = store.index!.content.events.map((event) => event.id)
  for (const objective of Object.values(state.business.objectives)) objective.status = 'achieved'
  state.pendingEffects = [{ id: 'refund', day: 201, source: 'refund', effects: [{ type: 'budget.change', amount: 60, note: 'Duplicate tooling cancelled' }] }]
  useGameStore.setState({ state, ui: { ...store.ui, toasts: [] } })
  expect(useGameStore.getState().dispatch({ type: 'advance', days: 1 }).ok).toBe(true)
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(state.resources.budgetRemaining + 60)
  expect(useGameStore.getState().ui.toasts.some((toast) => toast.message.includes('Budget changed from') && toast.message.includes('Duplicate tooling cancelled'))).toBe(true)
  render(<BudgetActivity />)
  expect(screen.getByRole('button', { name: 'Budget movements' })).toHaveAttribute('aria-expanded', 'true')
})
