// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgrammesScreen } from '@/screens/programmes/ProgrammesScreen'
import { useGameStore } from '@/store/game-store'

/**
 * Starting a programme costs two units of the week's attention. With less
 * left, the card offered "Start this", the dialog offered "Start the
 * programme", and only then did a toast say it could not be done.
 */
describe('starting a programme without the attention for it', () => {
  it('says so on the card instead of refusing after the click', async () => {
    await useGameStore.getState().startNewGame('ui-programme-attention', 'ciso')
    useGameStore.setState((store) => ({ state: { ...store.state!, resources: { ...store.state!.resources, focusRemaining: 1 } } }))
    render(<ProgrammesScreen />)
    const buttons = screen.getAllByRole('button', { name: 'Out of attention this week' })
    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) expect(button).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Start this' })).toBeNull()
  })
})
