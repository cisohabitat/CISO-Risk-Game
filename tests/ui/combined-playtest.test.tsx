// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { DecisionDeadlines } from '@/components/game/DecisionDeadlines'
import { ProgrammePromiseQuote, ProgrammeCommitments } from '@/components/game/ProgrammeCommitments'
import { openDecision } from '@/game/decisions/open'
import { programmeCommitments } from '@/store/commitments'
import { IncidentIllustration } from '@/components/game/IncidentIllustration'

afterEach(cleanup)
beforeEach(async () => { await useGameStore.getState().startNewGame('combined-reports', 'guided') })
it('requires informed material omissions before a board paper can be submitted', () => {
  const state = structuredClone(useGameStore.getState().state!)
  state.currentDay = 90
  state.reviews.pendingQuarter = 1
  Object.values(state.risks.scenarios)[0]!.status = 'accepted'
  useGameStore.setState({ state })
  render(<BoardScreen />)
  fireEvent.click(screen.getByRole('button', { name: /Prepare the Q1 board paper/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Take it to the board', exact: true }))
  expect(useGameStore.getState().state!.reviews.quarters).toHaveLength(0)
  expect(screen.getByRole('alert')).toHaveTextContent('material item')
  fireEvent.click(screen.getByRole('button', { name: 'Include all material items' }))
  fireEvent.click(screen.getByRole('button', { name: 'Take it to the board', exact: true }))
  expect(useGameStore.getState().state!.reviews.quarters.filter((item) => item.completed)).toHaveLength(1)
})
it('warns of the paper deadline even when no decision is open', () => {
  const state = structuredClone(useGameStore.getState().state!)
  state.currentDay = 175
  state.reviews.pendingQuarter = 1
  state.decisions.openIds = []
  useGameStore.setState({ state })
  render(<DecisionDeadlines />)
  expect(screen.getByText(/Q1 board paper/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Review board paper' }))
  expect(useGameStore.getState().ui.screen).toBe('board')
})
it('quotes an unaffordable promise before recording it and keeps the actual funding gap visible', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  state.resources.budgetRemaining = 100
  const decision = openDecision(state, store.index!, 'dec-audit-finding')!
  decision.selectedOptionId = 'opt-audit-programme'
  decision.resolvedDay = 10
  decision.resolvedByDefault = false
  useGameStore.setState({ state })
  const budget = state.resources.budgetRemaining
  render(<><ProgrammePromiseQuote programmeId="prog-identity" reviewAfterDays={100} /><ProgrammeCommitments /></>)
  expect(screen.getByText(/minimum allocation is currently unaffordable/)).toBeVisible()
  const commitments = screen.getByRole('region', { name: 'Recorded commitments' })
  expect(within(commitments).getByText(/Funding not arranged/)).toBeVisible()
  expect(programmeCommitments(state, store.index!)[0]!.shortfall).toBe(325)
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(budget)
})
it('removes the decorative incident box if its image fails', () => {
  const view = render(<IncidentIllustration name="Ransomware" />)
  fireEvent.error(view.container.querySelector('img')!)
  expect(view.container.querySelector('.incident-art')).toBeNull()
})
