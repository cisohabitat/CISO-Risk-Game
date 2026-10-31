// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { StartScreen } from '@/screens/start/StartScreen'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { BudgetActivity } from '@/components/game/BriefingNotes'
import { InvestigationPanel } from '@/components/risk/InvestigationPanel'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { formatGameDate } from '@/game/time'
import { runDays } from '@/game/engine/orchestrator'

beforeEach(async () => { await useGameStore.getState().startNewGame('oct31-newbie', 'guided') })
afterEach(cleanup)
function quiet(day: number) {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  state.currentDay = day
  state.resources.weekIndex = Math.floor(day / 7)
  state.decisions.openIds = []
  state.events.suppressedEventIds = store.index!.content.events.map((event) => event.id)
  state.pendingEffects = []
  state.threats.actors = {}; state.threats.campaigns = []
  for (const objective of Object.values(state.business.objectives)) objective.status = 'achieved'
  useGameStore.setState({ state })
  return state
}
it.each(['sit-inherited-mess', 'sit-new-money', 'sit-tidy', 'sit-after-breach'])('the top start button honours Guided and %s', async (situationId) => {
  useGameStore.setState({ state: null })
  render(<StartScreen />)
  fireEvent.click(screen.getByRole('radio', { name: /^Guided/ }))
  fireEvent.click(document.querySelector<HTMLInputElement>(`input[value="${situationId}"]`)!)
  expect(screen.getByTestId('start-selection')).toHaveTextContent('Guided')
  fireEvent.click(screen.getByRole('button', { name: 'Begin your first year' }))
  await waitFor(() => expect(useGameStore.getState().state?.situationId).toBe(situationId))
  expect(useGameStore.getState().state!.difficulty).toBe('guided')
})
it('bounds an oversized UI skip at a week while leaving headless advances unchanged', () => {
  const original = quiet(329)
  useGameStore.getState().advanceDays(30, true)
  expect(useGameStore.getState().state!.currentDay).toBe(336)
  expect(useGameStore.getState().state!.speed).toBe('paused')
  const headless = structuredClone(original)
  runDays(headless, useGameStore.getState().index!, 30)
  expect(headless.currentDay).toBe(359)
})
it('holds normal Guided time at attention renewal and announces the Q1 paper in Week 14', () => {
  quiet(5)
  const store = useGameStore.getState()
  store.dispatch({ type: 'setSpeed', speed: '1x' })
  store.advanceDays(30)
  expect(useGameStore.getState().state!.currentDay).toBe(7)
  expect(useGameStore.getState().state!.paused).toBe(true)
  quiet(90)
  store.advanceDays(30, true)
  const state = useGameStore.getState().state!
  expect(state.currentDay).toBe(91)
  expect(state.reviews.pendingQuarter).toBe(1)
  expect(formatGameDate(state.currentDay).weekLabel).toBe('Week 14')
})
it('makes a delivery watch and a further-enquiry route visible before an objective misses', () => {
  const state = quiet(155)
  state.business.objectives['obj-platform-launch']!.status = 'active'
  state.business.objectives['obj-platform-launch']!.progress = 0.85
  useGameStore.setState({ state })
  render(<HomeScreen />)
  expect(screen.getByLabelText('Business delivery watch')).toHaveTextContent('Launch the new customer platform')
  expect(screen.getByLabelText('Next checks on Guided')).toHaveTextContent('independently examined')
  fireEvent.click(screen.getByRole('button', { name: 'Choose the next enquiry' }))
  expect(useGameStore.getState().ui.screen).toBe('risk')
  expect(useGameStore.getState().ui.riskTab).toBe('investigate')
})
it('shows each first-week programme purchase in the open budget breakdown', () => {
  const store = useGameStore.getState()
  for (const id of ['prog-identity', 'prog-detection']) expect(store.dispatch({ type: 'startProgramme', programmeId: id, budget: store.index!.programme.get(id)!.budgetCost }).ok).toBe(true)
  render(<BudgetActivity />)
  const toggle = screen.getByRole('button', { name: 'Budget movements' })
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const ledger = document.getElementById(toggle.getAttribute('aria-controls')!)!
  expect(within(ledger).getByText(/Started Identity/)).toBeVisible()
  expect(within(ledger).getByText(/Started Detection/)).toBeVisible()
})
it('connects an unavailable triage button to its capacity explanation', async () => {
  await useGameStore.getState().startNewGame('triage-explanation', 'ciso')
  const state = structuredClone(useGameStore.getState().state!)
  state.team.functions.engineering!.capacity = 0
  useGameStore.setState({ state })
  render(<InvestigationPanel />)
  const button = screen.getByRole('button', { name: 'Commission: Vulnerability triage by exposure' })
  expect(button).toBeDisabled()
  expect(button).toHaveAccessibleDescription('The team it needs has no spare capacity.')
})
it.each([1, 2])('describes the actual %s optional items and permits each selection', (count) => {
  const state = quiet(91)
  state.reviews.pendingQuarter = 1
  Object.values(state.risks.scenarios).forEach((risk, i) => { risk.status = i < count ? 'open' : 'emerging'; risk.lastAssessed = { day: 91, exposure: 0.01, consequence: 0.01, residual: 0.01 } })
  useGameStore.setState({ state })
  render(<BoardScreen />)
  fireEvent.click(screen.getByRole('button', { name: /Prepare the Q1/ }))
  const dialog = screen.getByRole('dialog')
  const labels = Array.from(dialog.querySelectorAll('label.board-agenda-row')).filter((label) => label.textContent?.includes('Optional update'))
  expect(labels).toHaveLength(count)
  for (const label of labels) fireEvent.click(within(label as HTMLElement).getByRole('checkbox'))
  expect(within(dialog).getByLabelText('Agenda guidance')).toHaveTextContent(`${count} optional ${count === 1 ? 'update' : 'updates'} selected`)
  if (count === 1) expect(within(dialog).getByLabelText('Agenda guidance')).toHaveTextContent('Only one optional')
})
