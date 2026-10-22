// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProgrammesScreen } from '@/screens/programmes/ProgrammesScreen'
import { useGameStore } from '@/store/game-store'

afterEach(cleanup)
it('offers a programme that can be partially funded and keeps both slider endpoints reachable', async () => {
  await useGameStore.getState().startNewGame('partial-funding', 'ciso')
  useGameStore.setState((store) => ({ state: { ...store.state!, resources: { ...store.state!.resources, budgetRemaining: 600 } } }))
  render(<ProgrammesScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Start this: Identity and privileged access uplift' }))
  const slider = screen.getByRole('slider')
  expect(slider).toHaveAttribute('min', '425')
  expect(slider).toHaveAttribute('max', '600')
  expect(slider).toHaveValue('600')
  fireEvent.change(slider, { target: { value: '425' } })
  fireEvent.click(screen.getByRole('button', { name: 'Start the programme', exact: true }))
  expect(useGameStore.getState().state!.resources.budgetRemaining).toBe(175)
  expect(useGameStore.getState().state!.programmes.programmes['prog-identity']!.budgetAllocated).toBe(425)
})
