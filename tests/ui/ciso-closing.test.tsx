// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { AppShell } from '@/components/layout/AppShell'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { ProgrammesScreen } from '@/screens/programmes/ProgrammesScreen'
import { YearEndUpdates } from '@/components/game/YearEndUpdates'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { patternSuggestions } from '@/store/selectors'
import { pushMessage } from '@/game/inbox/messages'
import { InboxScreen } from '@/screens/inbox/InboxScreen'

afterEach(cleanup)
beforeEach(async () => { await useGameStore.getState().startNewGame('ciso-closing-ui', 'guided') })
it('counts a real decision separately from a large set of optional hypotheses', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  for (const objective of Object.values(state.business.objectives)) objective.targetDay = 364
  applyEffects(state, store.index.content.evidence.map((evidence) => ({ type: 'evidence.reveal' as const, evidenceId: evidence.id })), { index: store.index, rng: createRng(state.seed, state.rngCursor), source: 'test' })
  expect(patternSuggestions(state, store.index).length).toBeGreaterThan(1)
  useGameStore.setState({ state })
  render(<HomeScreen />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('1 thing needs your attention')
  expect(screen.getByText(/excluded from the attention total/)).toBeVisible()
  expect(screen.getByLabelText('Attention breakdown')).not.toHaveTextContent('hypoth')
})
it('explains a thirteen-message list with twelve unread after its first message opens', () => {
  const state = structuredClone(useGameStore.getState().state!)
  const template = state.inbox.messages[0]!
  state.inbox.messages = Array.from({ length: 13 }, (_, i) => ({ ...template, id: `msg-${100 + i}`, subject: `Message ${i}`, read: false }))
  state.inbox.counter = 113
  useGameStore.setState({ state })
  render(<InboxScreen />)
  expect(screen.getByText(/Showing 13 of 13 messages/)).toHaveTextContent('12 unread across all mail')
  expect(useGameStore.getState().state!.inbox.messages.filter((message) => !message.read)).toHaveLength(12)
})
it('retains both open and closed raised risks in a paper register without making closed ones material', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  state.currentDay = 91
  state.reviews.pendingQuarter = 1
  const [open, closed] = Object.values(state.risks.scenarios)
  open!.status = 'open'
  closed!.status = 'closed'
  useGameStore.setState({ state })
  render(<BoardScreen />)
  fireEvent.click(screen.getByRole('button', { name: /Prepare the Q1/ }))
  const button = within(screen.getByRole('dialog')).getByRole('button', { name: /^Raised risk register/ })
  fireEvent.click(button)
  const register = document.getElementById(button.getAttribute('aria-controls')!)!
  expect(register).toHaveTextContent(store.index.riskScenario.get(open!.id)!.title)
  expect(register).toHaveTextContent(store.index.riskScenario.get(closed!.id)!.title)
  expect(register).toHaveTextContent('closed; not a current agenda item')
})
it('confirms clearing the CIO blocker with actual attention and budget spent', () => {
  const state = structuredClone(useGameStore.getState().state!)
  Object.assign(state.programmes.programmes['prog-identity']!, { status: 'at-risk', progress: 0.5, startedDay: 1, budgetAllocated: 850, blockers: [{ id: 'blk-identity-exec', startedDay: 1, resolved: false }] })
  state.resources.focusRemaining = 5
  state.resources.budgetRemaining = 105
  useGameStore.setState({ state })
  render(<ProgrammesScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Hold the line with the CIO' }))
  expect(screen.getByRole('status', { name: 'Blocker cleared' })).toHaveTextContent('Used 1 attention and £0k budget')
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(105)
  expect(screen.queryByRole('button', { name: 'Hold the line with the CIO' })).toBeNull()
})
it('keeps December correspondence visible before a played-year review and preserves its grade', async () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  state.currentDay = 363
  state.decisions.openIds = []
  state.events.suppressedEventIds = store.index.content.events.map((event) => event.id)
  state.pendingEffects = [{ id: 'final-corvus', day: 364, source: 'decision:dec-q4-corvus-terms', note: 'The Corvus contract outcome is now recorded.', effects: [] }]
  pushMessage(state, { from: 'Threat intelligence', subject: 'Credentials in circulation', body: 'The final credential alert remains available.', type: 'threat', priority: 'urgent' })
  useGameStore.setState({ state })
  store.dispatch({ type: 'advance', days: 1 })
  expect(useGameStore.getState().state!.finished).toBe(false)
  useGameStore.getState().dispatch({ type: 'closeYear' })
  await useGameStore.getState().finishCampaign()
  const annual = useGameStore.getState().state!.reviews.annual
  expect(annual).toBeDefined()
  expect(useGameStore.getState().ui.screen).toBe('inbox')
  render(<YearEndUpdates />)
  expect(screen.getByRole('button', { name: /Credentials in circulation/ })).toBeVisible()
  expect(screen.getByRole('button', { name: /Followed up: Corvus renewal/ })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: /Credentials in circulation/ }))
  expect(useGameStore.getState().ui.screen).toBe('inbox')
  fireEvent.click(screen.getByRole('button', { name: 'Read the annual review' }))
  expect(useGameStore.getState().ui.screen).toBe('debrief')
  expect(useGameStore.getState().state!.reviews.annual).toBe(annual)
  expect(useGameStore.getState().ui.yearEndUpdates).toBeUndefined()
})

it('counts an unread update separately from unread reference mail in the actual shell', () => {
  const state = structuredClone(useGameStore.getState().state!)
  state.inbox.messages = []
  pushMessage(state, { from: 'Office', subject: 'Background', body: 'Reference', type: 'business' })
  pushMessage(state, { from: 'Office', subject: 'Needs review', body: 'Update', type: 'executive', priority: 'urgent' })
  useGameStore.setState({ state })
  render(<AppShell><p>Test reader</p></AppShell>)
  expect(screen.getByLabelText('1 unread updates')).toHaveTextContent('1')
  expect(useGameStore.getState().state!.inbox.messages.filter((message) => !message.read)).toHaveLength(2)
})
