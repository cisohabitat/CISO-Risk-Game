// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { IncidentCommand } from '@/components/game/IncidentCommand'
import { createIncident } from '@/game/incidents/create'
import { pushMessage } from '@/game/inbox/messages'

it('opens the latest message from this incident, not newer mail about an earlier response', async () => {
  await useGameStore.getState().startNewGame('incident-latest-message', 'ciso')
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  const earlier = createIncident(state, store.index!, { familyId: 'fam-service-tampering' })!
  earlier.phase = 'closed'
  const current = createIncident(state, store.index!, { familyId: 'fam-data-breach' })!
  current.phase = 'containment'
  const draft = { from: 'Incident response', subject: 'Response update', body: 'A response update.', type: 'incident' as const }
  pushMessage(state, { ...draft, incidentId: current.id })
  const latest = pushMessage(state, { ...draft, subject: 'Latest current update', incidentId: current.id })
  pushMessage(state, { ...draft, subject: 'Earlier incident review', incidentId: earlier.id })
  pushMessage(state, { ...draft, subject: 'Legacy unlinked update' })
  useGameStore.setState({ state })
  render(<IncidentCommand />)
  fireEvent.click(screen.getByRole('button', { name: 'Read the latest incident message' }))
  expect(useGameStore.getState().ui.screen).toBe('inbox')
  expect(useGameStore.getState().ui.selectedMessageId).toBe(latest.id)
})
