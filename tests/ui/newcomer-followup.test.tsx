// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { DecisionDialog } from '@/components/decisions/DecisionDialog'
import { DecisionDeadlines } from '@/components/game/DecisionDeadlines'
import { Onboarding } from '@/components/game/Onboarding'
import { Glossary } from '@/components/game/Glossary'
import { InvestigationPanel } from '@/components/risk/InvestigationPanel'
import { money } from '@/lib/formatting/labels'
import { RiskScreen } from '@/screens/risk/RiskScreen'
import { decisionReactions } from '@/store/decision-reactions'
import { openDecision } from '@/game/decisions/open'

afterEach(cleanup)
beforeEach(async () => { await useGameStore.getState().startNewGame('newcomer-followup', 'guided') })

it('shows the live attention balance and required rationale for the platform launch', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  const def = store.index!.content.decisions.find((d) => d.title === 'Security conditions on the platform launch')!
  const decision = openDecision(state, store.index!, def.id)!
  state.resources.focusRemaining = 2
  useGameStore.setState({ state })
  render(<DecisionDialog decisionId={decision.id} onClose={() => undefined} />)
  expect(screen.getByText(/2 attention available now/)).toBeVisible()
  expect(screen.getByText(/Why\? \(at least one reason\)/)).toBeVisible()
  fireEvent.click(screen.getAllByRole('radio')[0]!)
  const commit = screen.getByRole('button', { name: 'Go to reasons' })
  expect(commit).not.toHaveAttribute('aria-disabled')
  expect(commit).toBeEnabled()
  fireEvent.click(commit)
  expect(document.activeElement?.closest('#decision-why-reasons')).not.toBeNull()
  expect(useGameStore.getState().state!.decisions.openIds).toContain(decision.id)
})

it('keeps the SOC deadline visible and links to its exact decision', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  const decision = openDecision(state, store.index!, 'dec-soc-contract')!
  decision.deadlineDay = state.currentDay + 1
  useGameStore.setState({ state })
  render(<DecisionDeadlines />)
  expect(screen.getByText(/SOC contract renewal · due in 1 day/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Review: The SOC contract renewal' }))
  expect(useGameStore.getState().ui.openDecisionId).toBe(decision.id)
})

it('clears the decision receipt when time moves without removing decision history', () => {
  const store = useGameStore.getState()
  const state = store.state!
  store.setUi({ decisionReceipt: { gameId: state.gameId, year: state.year ?? 1, day: state.currentDay, title: 'Earlier choice', choice: 'A choice', budgetChange: 0, attentionChange: 0, unfundedChange: 0, evidenceIds: [], messageIds: [] } })
  const before = structuredClone(state.history.decisionsLog)
  store.advanceDays(1)
  expect(useGameStore.getState().state!.currentDay).toBeGreaterThan(state.currentDay)
  expect(useGameStore.getState().ui.decisionReceipt).toBeUndefined()
  expect(useGameStore.getState().state!.history.decisionsLog).toEqual(before)
})

it('explains within-band confidence changes and names a crossed band', () => {
  const store = useGameStore.getState()
  const before = structuredClone(store.state!)
  const after = structuredClone(before)
  before.stakeholders.boardConfidence = 0.5
  after.stakeholders.boardConfidence = 0.55
  expect(decisionReactions(before, after, store.index!)).toContainEqual({ text: 'Board confidence rose within the Neutral band.', tone: 'positive' })
  after.stakeholders.boardConfidence = 0.7
  expect(decisionReactions(before, after, store.index!)).toContainEqual({ text: 'Board confidence rose from Neutral to Solid.', tone: 'positive' })
})

it('lets a newcomer revisit a dismissed teaching tip', () => {
  render(<><Onboarding /><Glossary /></>)
  fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
  expect(screen.queryByText('A first quarter, in three questions')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Revisit teaching tips' }))
  const glossary = screen.getByRole('dialog')
  fireEvent.click(within(glossary).getByRole('button', { name: 'A first quarter, in three questions' }))
  expect(within(glossary).getByText(/Before the Q1 board paper/)).toBeVisible()
})

it('opens a guided Risk visit with an evidence route and separates raising from agenda selection', () => {
  render(<RiskScreen />)
  expect(screen.getByText(/you still choose the agenda in the board paper/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Start with evidence' }))
  expect(useGameStore.getState().ui.riskTab).toBe('evidence')
  expect(screen.getByRole('tab', { name: /Evidence/ })).toHaveAttribute('aria-selected', 'true')
})

it('quotes paid and free enquiry costs before anything is commissioned', () => {
  const store = useGameStore.getState()
  // Clear staffing/budget constraints so this tests the quote rather than availability.
  const state = structuredClone(store.state!)
  state.resources.budgetRemaining = 10000
  state.resources.focusRemaining = state.resources.focusPerWeek
  for (const fn of Object.values(state.team.functions)) { fn.capacity = 1; fn.committed = 0 }
  useGameStore.setState({ state })
  const view = render(<InvestigationPanel />)
  fireEvent.click(screen.getByRole('button', { name: /^Show all .* available enquiries/ }))
  const buttons = screen.getAllByRole('button', { name: /^Commission:/ }).filter((button) => !button.hasAttribute('disabled'))
  const paid = buttons.find((button) => {
    const name = button.getAttribute('aria-label')!.replace('Commission: ', '')
    return store.index!.content.investigations.find((item) => item.name === name)!.budgetCost > 0
  })!
  const def = store.index!.content.investigations.find((item) => `Commission: ${item.name}` === paid.getAttribute('aria-label'))!
  fireEvent.click(paid)
  expect(within(screen.getByRole('dialog')).getByText(`This uses ${def.focusCost} attention and ${money(def.budgetCost)} budget.`, { exact: false })).toBeVisible()
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(10000)
  expect(useGameStore.getState().state!.team.assignments).toHaveLength(state.team.assignments.length)
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
  const free = buttons.find((button) => {
    const name = button.getAttribute('aria-label')!.replace('Commission: ', '')
    return store.index!.content.investigations.find((item) => item.name === name)!.budgetCost === 0
  })!
  fireEvent.click(free)
  expect(within(screen.getByRole('dialog')).getByText(/attention and no budget/)).toBeVisible()
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(10000)
  view.unmount()
})
