// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { RiskScreen } from '@/screens/risk/RiskScreen'
import { TeamScreen } from '@/screens/team/TeamScreen'
import { InboxScreen } from '@/screens/inbox/InboxScreen'
import { CameBack } from '@/components/game/CameBack'
import { useGameStore } from '@/store/game-store'
import { pushMessage } from '@/game/inbox/messages'

afterEach(cleanup)

it('keeps board selections through a risk review and clears the draft at a campaign transition', async () => {
  await useGameStore.getState().startNewGame('fresh-board-draft', 'ciso')
  useGameStore.setState((store) => {
    const state = structuredClone(store.state!)
    state.currentDay = 91
    state.reviews.pendingQuarter = 1
    const risk = Object.values(state.risks.scenarios)[0]!
    risk.status = 'open'
    return { state }
  })
  const board = render(<BoardScreen />)
  fireEvent.click(screen.getByRole('button', { name: /Prepare the Q1/ }))
  const dialog = screen.getByRole('dialog')
  const first = within(dialog).getAllByRole('checkbox')[0]!
  if (!(first as HTMLInputElement).checked) fireEvent.click(first)
  const name = first.closest('label')!.textContent!
  fireEvent.click(within(dialog).getByRole('button', { name: 'Identity uplift', exact: true }))
  fireEvent.click(within(dialog).getByRole('button', { name: /Review emerging risks/ }))
  expect(useGameStore.getState().ui.screen).toBe('risk')
  board.unmount()
  const risk = render(<RiskScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Return to board paper draft' }))
  risk.unmount()
  render(<BoardScreen />)
  expect(screen.getByRole('dialog')).toBeVisible()
  expect(screen.getAllByRole('checkbox').find((input) => input.closest('label')?.textContent === name)).toBeChecked()
  expect(screen.getByRole('button', { name: 'Identity uplift', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await useGameStore.getState().startNewGame('fresh-board-new', 'ciso')
  expect(useGameStore.getState().ui.boardDraft).toBeUndefined()
})

it('shows incoming staff and their dates alongside unfilled roles', async () => {
  await useGameStore.getState().startNewGame('fresh-staff-ui', 'ciso')
  useGameStore.setState((store) => {
    const state = structuredClone(store.state!)
    state.pendingEffects.push({ id: 'hire', day: 60, source: 'hire', effects: [{ type: 'team.vacancyFilled', fn: 'iam' }] })
    return { state }
  })
  render(<TeamScreen />)
  const row = screen.getByRole('heading', { name: 'Identity and access', exact: true }).closest('li')!
  expect(within(row).getByText(/2 vacancies/)).toHaveTextContent('1 incoming · 1 not yet recruiting. Expected around')
  const another = within(row).getByRole('button', { name: /Recruit another/ })
  expect(another).toBeEnabled()
  const before = useGameStore.getState().state!.resources.budgetRemaining
  fireEvent.click(another)
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(before - 120)
  expect(within(row).getByText(/2 vacancies/)).toHaveTextContent('2 incoming · 0 not yet recruiting')
  expect(within(row).getByRole('button', { name: 'Recruiting…' })).toBeDisabled()
})

it('takes an enquiry reader straight to visible evidence', async () => {
  await useGameStore.getState().startNewGame('fresh-evidence-ui', 'ciso')
  useGameStore.setState((store) => {
    const state = structuredClone(store.state!)
    const message = pushMessage(state, { from: 'Cyber team', subject: 'Completed: Review', body: 'Results are in.', type: 'discovery' })
    return { state, ui: { ...store.ui, selectedMessageId: message.id } }
  })
  const inbox = render(<InboxScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Review evidence' }))
  expect(useGameStore.getState().ui.screen).toBe('risk')
  inbox.unmount()
  render(<RiskScreen />)
  expect(screen.getByRole('tab', { name: /Evidence/ })).toHaveAttribute('aria-selected', 'true')
})

it('leaves every grouped delivery message reachable', async () => {
  await useGameStore.getState().startNewGame('fresh-delivery-ui', 'ciso')
  let milestoneId = ''
  useGameStore.setState((store) => {
    const state = structuredClone(store.state!)
    state.inbox.messages = []
    const draft = { from: 'Recovery', body: 'Delivered.', type: 'programme' as const, returnGroup: 'programme:recovery' }
    milestoneId = pushMessage(state, { ...draft, subject: 'Milestone: Programme complete' }).id
    pushMessage(state, { ...draft, subject: 'Delivered: Recovery' })
    return { state }
  })
  render(<CameBack />)
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Also: Milestone: Programme complete' }))
  expect(useGameStore.getState().ui.selectedMessageId).toBe(milestoneId)
  expect(useGameStore.getState().ui.screen).toBe('inbox')
})
