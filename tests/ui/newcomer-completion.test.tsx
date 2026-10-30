// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { InvestigationPanel } from '@/components/risk/InvestigationPanel'
import { DecisionDeadlines } from '@/components/game/DecisionDeadlines'
import { HypothesisWorkspace } from '@/components/risk/HypothesisWorkspace'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'

afterEach(cleanup)
beforeEach(async () => { await useGameStore.getState().startNewGame('newcomer-completion', 'guided') })
it('opens the judgement guide on day one without computing a live grade', () => {
  render(<HomeScreen />)
  expect(screen.getByRole('button', { name: 'How to judge your year', exact: true })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(/Strong individual dimensions do not cancel/)).toBeVisible()
})
it('makes a Skip-held decision reachable from Risk even when its deadline is distant', () => {
  useGameStore.getState().setScreen('risk')
  const day = useGameStore.getState().state!.currentDay
  useGameStore.getState().advanceDays(30, true)
  render(<DecisionDeadlines />)
  expect(screen.getByRole('status')).toHaveTextContent('Skip ahead is held')
  fireEvent.click(screen.getAllByRole('button', { name: /^Decide:/ })[0]!)
  expect(useGameStore.getState().ui.openDecisionId).toBeTruthy()
  expect(useGameStore.getState().state!.currentDay).toBe(day)
})
it('requires acknowledgement before adding work to an overloaded leader', () => {
  const state = structuredClone(useGameStore.getState().state!)
  for (const fn of Object.values(state.team.functions)) fn.capacity = 20
  for (const leader of Object.values(state.team.leaders)) leader.workload = 0.9
  useGameStore.setState({ state })
  render(<InvestigationPanel />)
  fireEvent.click(screen.getAllByRole('button', { name: /^Commission:/ })[0]!)
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByRole('button', { name: 'Commission the work' })).toBeDisabled()
  const focus = useGameStore.getState().state!.resources.focusRemaining
  fireEvent.click(within(dialog).getByRole('checkbox', { name: /I understand and commission/ }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Commission the work' }))
  expect(useGameStore.getState().state!.resources.focusRemaining).toBeLessThan(focus)
  expect(screen.getByRole('status', { name: 'Commission confirmation' })).toBeVisible()
})
it('starts Guided with a short public enquiry menu and keeps the full menu reachable', () => {
  render(<InvestigationPanel />)
  expect(screen.getAllByRole('button', { name: /^Commission:/ })).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: /^Show all .* available enquiries/ }))
  expect(screen.getAllByRole('button', { name: /^Commission:/ }).length).toBeGreaterThan(3)
})
it('quotes raising before spending attention, lets it cancel, and confirms the actual raise', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  const template = store.index.content.hypothesisTemplates[0]!
  const evidence = store.index.content.evidence.find((item) => item.tags.some((tag) => template.supportingTags.includes(tag)))!
  applyEffects(state, [{ type: 'evidence.reveal', evidenceId: evidence.id }], { index: store.index, rng: createRng(state.seed, state.rngCursor), source: 'test' })
  useGameStore.setState({ state })
  store.dispatch({ type: 'createHypothesis', templateId: template.id, evidenceIds: [evidence.id] })
  const focus = useGameStore.getState().state!.resources.focusRemaining
  render(<HypothesisWorkspace />)
  fireEvent.click(screen.getByRole('button', { name: /^Raise as a risk scenario/ }))
  expect(useGameStore.getState().state!.resources.focusRemaining).toBe(focus)
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
  expect(useGameStore.getState().state!.resources.focusRemaining).toBe(focus)
  fireEvent.click(screen.getByRole('button', { name: /^Raise as a risk scenario/ }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Raise this risk ·/ }))
  expect(useGameStore.getState().state!.resources.focusRemaining).toBe(focus - 2)
  expect(screen.getByRole('status', { name: 'Risk raised' })).toBeVisible()
})
it('retains the actual meeting account and attention cost beside the executive', () => {
  render(<BoardScreen />)
  fireEvent.click(screen.getAllByRole('button', { name: /^Brief them:/ })[0]!)
  expect(screen.getByRole('status', { name: 'Meeting recorded' })).toHaveTextContent('Used 1 attention')
  expect(useGameStore.getState().state!.inbox.messages.some((message) => message.subject.startsWith('Your meeting with'))).toBe(true)
})
