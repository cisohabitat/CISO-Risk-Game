// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { IncidentCommand } from '@/components/game/IncidentCommand'
import { createIncident } from '@/game/incidents/create'
import { runDays } from '@/game/engine/orchestrator'

afterEach(cleanup)

it('offers Brief the board on a live incident, then says when it was briefed', async () => {
  await useGameStore.getState().startNewGame('brief-board-ui', 'ciso')
  const { index } = useGameStore.getState()
  const state = structuredClone(useGameStore.getState().state!)
  state.events.suppressedEventIds = index!.content.events.map((event) => event.id)
  const incident = createIncident(state, index!, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
  incident.detectionDay = state.currentDay
  runDays(state, index!, 2)
  useGameStore.setState({ state })
  render(<IncidentCommand />)
  expect(screen.getByLabelText('The board')).toHaveTextContent('The board expects to hear from you by')
  fireEvent.click(screen.getByRole('button', { name: 'Brief the board: what we know and do not · 1 attention' }))
  expect(screen.getByLabelText('The board')).toHaveTextContent('Board briefed on')
  expect(screen.getByLabelText('The board')).toHaveTextContent('what is known and what is not')
  expect(screen.queryByRole('button', { name: 'Brief the board: it is in hand · 1 attention' })).toBeNull()
})
