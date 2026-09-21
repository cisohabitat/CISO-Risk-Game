// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Terms } from '@/components/game/Terms'
import { useGameStore } from '@/store/game-store'

/** The subject's words, tappable where they appear, opening the glossary at the entry. */
describe('term chips', () => {
  it('finds the subject\'s words in a risk and opens the glossary at them', async () => {
    await useGameStore.getState().startNewGame('ui-terms', 'ciso')
    render(<Terms text="Compromise of the identity platform: a managed service provider identity uses standing privileged access to reach production administration." />)
    expect(screen.getByRole('button', { name: 'Privileged access' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Managed service provider' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Identity platform' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Privileged access' }))
    expect(useGameStore.getState().ui.glossaryOpen).toBe(true)
    expect(useGameStore.getState().ui.glossaryTerm).toBe('gls-privileged')
  })

  it('renders nothing for text with no term of art in it', async () => {
    await useGameStore.getState().startNewGame('ui-terms-2', 'ciso')
    const { container } = render(<Terms text="The CEO wants three risks in twenty-three minutes." />)
    expect(container.innerHTML).toBe('')
  })
})
