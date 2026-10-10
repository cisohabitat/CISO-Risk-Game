// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShortcutsToggle } from '@/components/game/ShortcutsToggle'
import { setShortcuts } from '@/lib/settings/shortcuts'
import { useKeyboardShortcuts } from '@/app/useKeyboardShortcuts'
import { useGameStore } from '@/store/game-store'

function Harness() {
  useKeyboardShortcuts()
  return <ShortcutsToggle />
}

/**
 * Single-key shortcuts can be turned off (WCAG 2.1.4). The accessibility
 * statement said they could not, and a screen-reader user in browse mode can
 * meet them.
 */
describe('the shortcut keys setting', () => {
  afterEach(() => setShortcuts(true))

  it('stops the single-key shortcuts when turned off, and keeps the choice', async () => {
    await useGameStore.getState().startNewGame('ui-shortcuts', 'ciso')
    render(<Harness />)
    fireEvent.keyDown(document.body, { key: 'i' })
    expect(useGameStore.getState().ui.screen).toBe('inbox')

    fireEvent.click(screen.getByRole('button', { name: 'Shortcut keys on' }))
    expect(screen.getByRole('button', { name: 'Shortcut keys off' }).getAttribute('aria-pressed')).toBe('false')
    expect(localStorage.getItem('ciso-shortcuts')).toBe('off')
    fireEvent.keyDown(document.body, { key: 'r' })
    expect(useGameStore.getState().ui.screen).toBe('inbox')
  })
})
