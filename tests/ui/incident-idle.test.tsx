// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { IncidentCommand } from '@/components/game/IncidentCommand'
import { createIncident } from '@/game/incidents/create'

// The panel was an alarm with no next step on the day an incident escalated:
// its response decisions open the day after, and nothing said so.
it('says what waits on the player when no response decision is open', async () => {
  await useGameStore.getState().startNewGame('incident-idle', 'ciso')
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  const incident = createIncident(state, store.index!, { familyId: 'fam-data-breach' })!
  incident.phase = 'escalation'
  useGameStore.setState({ state })
  const { unmount } = render(<IncidentCommand />)
  expect(screen.getByText('Nothing waits on you yet.')).toBeTruthy()
  expect(screen.getByText(/reach you when the clock next moves/)).toBeTruthy()
  unmount()

  incident.phase = 'recovery'
  useGameStore.setState({ state: structuredClone(state) })
  render(<IncidentCommand />)
  expect(screen.getByText(/without your direction/)).toBeTruthy()
})
