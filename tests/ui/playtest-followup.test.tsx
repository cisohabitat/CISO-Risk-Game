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
import { IncidentCommand } from '@/components/game/IncidentCommand'
import { AppShell } from '@/components/layout/AppShell'
import { BoardScreen } from '@/screens/board/BoardScreen'

afterEach(cleanup)

describe('the October playtest follow-up', () => {
  it('directs an empty decision state to the active response journal', async () => {
    await useGameStore.getState().startNewGame('ui-incident-next', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.decisions.openIds = []
      createIncident(state, store.index!, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })
      return { state }
    })
    const view = render(<><IncidentCommand /><DecisionList quiet /></>)
    const heading = view.container.querySelector<HTMLElement>('#incident-command')!
    heading.scrollIntoView = () => {}
    expect(screen.getByText('No response decision is open yet')).toBeVisible()
    expect(screen.queryByText(/Nothing needs an answer/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Review the active incident' }))
    expect(heading).toHaveFocus()
  })

  it('names every struggling function separately from spare workload capacity', async () => {
    await useGameStore.getState().startNewGame('ui-sidebar-health', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.team.functions.engineering!.morale = 0.2
      state.team.functions.iam!.morale = 0.2
      return { state }
    })
    render(<AppShell><p>Test content</p></AppShell>)
    const summary = screen.getByTestId('team-wellbeing-summary')
    expect(within(summary).getByText('Engineering burning out')).toBeTruthy()
    expect(within(summary).getByText('Identity burning out')).toBeTruthy()
    fireEvent.click(within(summary).getByRole('button'))
    expect(useGameStore.getState().ui.screen).toBe('team')
  })

  it('explains Board eligibility without hiding programme recommendations', async () => {
    await useGameStore.getState().startNewGame('ui-board-eligibility', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.currentDay = 90
      state.reviews.pendingQuarter = 1
      return { state }
    })
    render(<BoardScreen />)
    fireEvent.click(screen.getByRole('button', { name: /Prepare the Q1 board paper/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/This paper reports Q1 results during Q2/)).toBeVisible()
    expect(within(dialog).getByText('No agenda topics are eligible yet')).toBeVisible()
    expect(within(dialog).getByText('Recommendations', { exact: true })).toBeVisible()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Review risks for the paper' }))
    expect(useGameStore.getState().ui.screen).toBe('risk')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

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
