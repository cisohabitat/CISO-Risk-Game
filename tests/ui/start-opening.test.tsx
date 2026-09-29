// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { StartScreen } from '@/screens/start/StartScreen'
import { useGameStore } from '@/store/game-store'

/**
 * The campaign content loads while the start screen is up, not before it. On
 * Slow 3G a click one second after the screen appeared waited 2.8 s for it,
 * and a button that did nothing for that long would read as broken.
 */
describe('opening a campaign from the start screen', () => {
  it('says it is opening, and cannot be pressed twice', async () => {
    render(<StartScreen />)
    const begin = screen.getByRole('button', { name: 'Begin your first day' })
    fireEvent.click(begin)
    const opening = screen.getByRole('button', { name: 'Opening the campaign…' })
    expect(opening).toBeDisabled()
    expect(opening.getAttribute('aria-busy')).toBe('true')
    await act(async () => {
      await useGameStore.getState().ensureCampaign()
    })
    await vi.waitFor(() => expect(useGameStore.getState().state).not.toBeNull())
  })
})
