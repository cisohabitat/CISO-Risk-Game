// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { ProgrammeCommitments } from '@/components/game/ProgrammeCommitments'
import { QuietWeekNote } from '@/components/game/BriefingNotes'
import { AppShell } from '@/components/layout/AppShell'
import { RiskScreen } from '@/screens/risk/RiskScreen'
import { PatternNotice } from '@/components/risk/PatternNotice'
import { InvestigationPanel } from '@/components/risk/InvestigationPanel'
import { decisionReactions } from '@/store/decision-reactions'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { TeamScreen } from '@/screens/team/TeamScreen'
import { DecisionDialog } from '@/components/decisions/DecisionDialog'
import { applyAction } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { patternSuggestions } from '@/store/selectors'

afterEach(cleanup)
beforeEach(async () => { await useGameStore.getState().startNewGame('newbie-retest-ui', 'guided') })
it('acknowledges a past checkpoint without inventing an outcome for a legacy save', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  const decision = openDecision(state, store.index!, 'dec-audit-finding')!
  decision.resolvedDay = 10
  decision.selectedOptionId = 'opt-audit-programme'
  state.currentDay = 280
  state.programmes.programmes['prog-identity']!.status = 'complete'
  useGameStore.setState({ state })
  render(<ProgrammeCommitments />)
  expect(screen.getByText(/no dated outcome is recorded in this save/)).toBeVisible()
  expect(screen.queryByText(/Review scheduled for/)).toBeNull()
})
it.each([17, 82])('shows %s unread messages and updates after one is read', (count) => {
  const state = structuredClone(useGameStore.getState().state!)
  const template = state.inbox.messages[0]!
  state.inbox.messages = Array.from({ length: count }, (_, i) => ({ ...template, id: `msg-${i + 100}`, read: false }))
  useGameStore.setState({ state })
  render(<AppShell><p>Test reader</p></AppShell>)
  const badge = screen.getByLabelText(`${count} unread messages`)
  expect(badge).toHaveTextContent(String(count))
  act(() => { useGameStore.getState().dispatch({ type: 'markRead', messageId: 'msg-100' }) })
  expect(screen.getByLabelText(`${count - 1} unread messages`)).toHaveTextContent(String(count - 1))
})
it('changes the raised count while keeping the total concerns unchanged', () => {
  const state = structuredClone(useGameStore.getState().state!)
  const risk = Object.values(state.risks.scenarios)[0]!
  risk.status = 'emerging'
  useGameStore.setState({ state })
  render(<RiskScreen />)
  const counts = screen.getByLabelText('Risk register counts').textContent
  act(() => { useGameStore.getState().dispatch({ type: 'openRisk', scenarioId: risk.id }) })
  expect(screen.getByLabelText('Risk register counts').textContent).not.toBe(counts)
  expect(screen.getByLabelText('Risk register counts')).toHaveTextContent(`${Object.keys(state.risks.scenarios).length} total concerns`)
})
it('describes the actual capacity purchase without claiming burnout ended', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  for (const fn of Object.values(state.team.functions)) fn.capacity = 20
  state.team.functions.iam!.capacity = 0.5
  state.team.functions.iam!.committed = 10
  state.team.functions.iam!.morale = 0.01
  const decision = openDecision(state, store.index!, 'dec-team-overload')!
  useGameStore.setState({ state })
  const before = structuredClone(state)
  expect(useGameStore.getState().dispatch({ type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-overload-buy', rationaleTagIds: ['rat-resources'] }).ok).toBe(true)
  const after = useGameStore.getState().state!
  const reactions = decisionReactions(before, after, store.index!)
  expect(reactions.some((reaction) => reaction.text.includes('Current wellbeing: Burning out'))).toBe(true)
  expect(reactions.some((reaction) => reaction.text.includes('morale lifted within the Burning out band'))).toBe(true)
  expect(after.team.functions.iam!.capacity).toBe(2)
  render(<TeamScreen />)
  expect(screen.getByText(/Latest recorded change:.*capacity changed from 0.5 to 2/)).toBeVisible()
})
it('retains a named confirmation when the offered hypothesis is formed', () => {
  const store = useGameStore.getState()
  for (let n = 0; n < 120 && patternSuggestions(useGameStore.getState().state!, store.index!).length === 0; n += 1) store.advanceDays(1)
  expect(patternSuggestions(useGameStore.getState().state!, store.index!).length).toBeGreaterThan(0)
  render(<PatternNotice />)
  fireEvent.click(screen.getByRole('button', { name: /^Form the hypothesis/ }))
  expect(screen.getByRole('status')).toHaveTextContent('Draft formed:')
  fireEvent.click(screen.getByRole('button', { name: 'View working hypotheses' }))
  expect(useGameStore.getState().ui).toMatchObject({ screen: 'risk', riskTab: 'hypotheses' })
})
it('confirms commissioning in place and retains completed or stopped work', () => {
  render(<InvestigationPanel />)
  fireEvent.click(screen.getAllByRole('button', { name: /^Commission:/ }).find((button) => !button.hasAttribute('disabled'))!)
  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Commission the work' }))
  expect(screen.getByRole('status')).toHaveTextContent('commissioned')
  expect(useGameStore.getState().state!.team.assignments).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Completed and stopped enquiries' }))
  expect(screen.getByText('No enquiry has finished or been stopped yet.')).toBeVisible()
  act(() => {
    for (let n = 0; n < 100 && useGameStore.getState().state!.team.assignments[0]!.status === 'running'; n += 1) useGameStore.getState().advanceDays(1)
  })
  const completed = useGameStore.getState().state!.team.assignments[0]!
  expect(completed.status).toBe('complete')
  expect(screen.getByRole('heading', { name: `${completed.title} · Completed` }).parentElement).toHaveTextContent(completed.resultSummary!.replace(/\s+/g, ' '))
})
it('offers a factual note during a quiet decision week', () => {
  const state = structuredClone(useGameStore.getState().state!)
  state.currentDay = 150
  state.decisions.openIds = []
  useGameStore.setState({ state })
  render(<QuietWeekNote />)
  expect(screen.getByLabelText('A quieter week')).toHaveTextContent('No new decision has arrived in the last seven days')
  expect(screen.getByLabelText('A quieter week')).toHaveTextContent('does not establish that risk has fallen')
})

it('explains the attention total and exposes decisions beyond the initial four', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  for (const def of store.index!.content.decisions) {
    if (state.decisions.openIds.length >= 5) break
    openDecision(state, store.index!, def.id)
  }
  useGameStore.setState({ state })
  render(<HomeScreen />)
  expect(screen.getByLabelText('Attention breakdown')).toHaveTextContent('5 open decisions')
  expect(screen.getAllByRole('button', { name: /^Decide:/ })).toHaveLength(4)
  fireEvent.click(screen.getByRole('button', { name: 'Show 1 more decision' }))
  expect(screen.getAllByRole('button', { name: /^Decide:/ })).toHaveLength(5)
})
it('asks what evidence will change the call when the same reason is reused', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  for (const def of store.index!.content.decisions.slice(0, 3)) {
    const decision = openDecision(state, store.index!, def.id)!
    expect(applyAction(state, store.index!, { type: 'resolveDecision', decisionId: decision.id, optionId: def.options[0]!.id, rationaleTagIds: ['rat-more-evidence'] }).ok).toBe(true)
  }
  const decision = openDecision(state, store.index!, 'dec-budget-reallocation')!
  useGameStore.setState({ state })
  render(<DecisionDialog decisionId={decision.id} onClose={() => undefined} />)
  fireEvent.click(screen.getByRole('button', { name: 'More evidence is required' }))
  expect(screen.getByRole('note')).toHaveTextContent('You have used this reason 3 times before')
  expect(screen.getByRole('note')).toHaveTextContent('does not commission an enquiry or extend a deadline')
})
