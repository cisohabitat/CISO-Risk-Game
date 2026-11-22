// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { wantsYouCount } from '@/store/selectors'
import { IncidentCommand } from '@/components/game/IncidentCommand'
import { createIncident } from '@/game/incidents/create'

afterEach(cleanup)

// 4398537 playtest: the rail badge counted decisions alone, beside "3 things
// need your attention"; and an incident late in December read "by 34 Dec".
it('counts a pending board paper in what wants the player', async () => {
  await useGameStore.getState().startNewGame('badge-count', 'ciso')
  const { index } = useGameStore.getState()
  const state = structuredClone(useGameStore.getState().state!)
  state.decisions.openIds = []
  const without = wantsYouCount(state, index!)
  state.reviews.pendingQuarter = 1
  expect(wantsYouCount(state, index!)).toBe(without + 1)
})

it('does not date the board briefing past the year end', async () => {
  await useGameStore.getState().startNewGame('late-incident', 'ciso')
  const { index } = useGameStore.getState()
  const state = structuredClone(useGameStore.getState().state!)
  state.currentDay = 362
  const incident = createIncident(state, index!, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
  incident.phase = 'containment'; incident.responseStartedDay = 362
  useGameStore.setState({ state })
  render(<IncidentCommand />)
  expect(screen.getByLabelText('The board')).toHaveTextContent('before the year closes')
  expect(screen.getByLabelText('The board')).not.toHaveTextContent(/3[2-9] Dec/)
})
