// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { RiskScreen } from '@/screens/risk/RiskScreen'
import { useGameStore } from '@/store/game-store'

it('explains the emerging-to-board transition before raising a concern', async () => {
  await useGameStore.getState().startNewGame('risk-board-guidance', 'ciso')
  const home = render(<HomeScreen />)
  expect(screen.getAllByText('Emerging · not raised for the board').length).toBeGreaterThan(0)
  fireEvent.click(screen.getAllByRole('button', { name: 'Examine and consider raising' })[0]!)
  const scenarioId = useGameStore.getState().ui.selectedScenarioId!
  expect(useGameStore.getState().state!.risks.scenarios[scenarioId]!.status).toBe('emerging')
  home.unmount()
  render(<RiskScreen />)
  expect(screen.getByText(/funding or linking treatment alone does not raise it/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Raise as a risk scenario', exact: true }))
  expect(useGameStore.getState().state!.risks.scenarios[scenarioId]!.status).toBe('open')
  expect(screen.queryByText(/funding or linking treatment alone does not raise it/)).toBeNull()
})
