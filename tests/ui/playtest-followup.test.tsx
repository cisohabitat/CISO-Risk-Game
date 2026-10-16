// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { DecisionList } from '@/components/decisions/DecisionList'
import { IncidentHistory } from '@/components/game/IncidentHistory'
import { TeamScreen } from '@/screens/team/TeamScreen'
import { useGameStore } from '@/store/game-store'
import { createIncident } from '@/game/incidents/create'
import { buildReconstruction } from '@/game/incidents/engine'
import { pushMessage } from '@/game/inbox/messages'

afterEach(cleanup)

describe('the October playtest follow-up', () => {
  it('offers the review rather than advancing a finished year', async () => {
    await useGameStore.getState().startNewGame('ui-ended-year', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.finished = true
      state.decisions.openIds = []
      return { state }
    })
    render(<DecisionList />)
    expect(screen.queryByText(/Advance time/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open Your year' }))
    expect(useGameStore.getState().ui.screen).toBe('debrief')
  })

  it('explains recovery and vacancy pressure separately from capacity', async () => {
    await useGameStore.getState().startNewGame('ui-recovery-guidance', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      Object.assign(state.team.functions.engineering!, { morale: 0.2, committed: 0, vacancies: 0 })
      Object.assign(state.team.functions.iam!, { morale: 0.2, committed: 0, vacancies: 1 })
      return { state }
    })
    render(<TeamScreen />)
    const engineering = screen.getByRole('heading', { name: 'Security engineering', exact: true }).closest('li')!
    expect(within(engineering).getByText(/Recovering slowly/)).toBeVisible()
    const identity = screen.getByRole('heading', { name: 'Identity and access', exact: true }).closest('li')!
    expect(within(identity).getByText(/Morale is declining/)).toBeVisible()
  })

  it('shows a closed reconstruction before year-end and opens the exact warning', async () => {
    await useGameStore.getState().startNewGame('ui-warning-audit', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.currentDay = 10
      const warning = pushMessage(state, { from: 'Sentinel SOC', subject: 'A specific warning', body: 'A signal on the portal', type: 'threat', signalCampaignId: 'audit-campaign' })
      state.currentDay = 20
      createIncident(state, store.index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })
      const incident = Object.values(state.incidents.incidents)[0]!
      incident.campaignId = 'audit-campaign'
      incident.phase = 'closed'
      state.currentDay = 30
      incident.reconstruction = buildReconstruction(state, store.index, incident)
      expect(incident.reconstruction.warningMessageIds).toEqual([warning.id])
      return { state }
    })
    render(<IncidentHistory />)
    expect(screen.getByText(/Control assessment at incident debrief/)).toHaveTextContent('Conditions at intrusion time were not recorded')
    fireEvent.click(screen.getByRole('button', { name: /Open warning:.*A specific warning/ }))
    expect(useGameStore.getState().ui.screen).toBe('inbox')
    const selected = useGameStore.getState().ui.selectedMessageId
    expect(useGameStore.getState().state!.inbox.messages.find((m) => m.id === selected)?.subject).toBe('A specific warning')
  })
})
