// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PatternNotice } from '@/components/risk/PatternNotice'
import { useGameStore } from '@/store/game-store'
import { patternSuggestions } from '@/store/selectors'

/**
 * The offer the player cannot afford has to say so before the click.
 *
 * This was guarded by an end-to-end test whose only assertion sat inside
 * `if (week.startsWith('0'))`, which on its seed never ran: removing the
 * `disabled` prop left it green. A test that passes with the defect present
 * guards nothing. This one arranges the state directly, so both branches are
 * asserted every time, on every run.
 */
describe('the pattern notice', () => {
  beforeEach(async () => {
    await useGameStore.getState().startNewGame('ui-pattern', 'ciso')
    const store = useGameStore.getState()
    // Walk until the evidence in hand offers something.
    for (let i = 0; i < 120; i += 1) {
      const state = useGameStore.getState().state!
      if (patternSuggestions(state, store.index).length > 0) break
      store.dispatch({ type: 'advance', days: 1 })
    }
  })

  it('offers the hypothesis while there is attention to spend', () => {
    const state = useGameStore.getState().state!
    expect(patternSuggestions(state, useGameStore.getState().index).length, 'no offer to test against').toBeGreaterThan(0)
    expect(state.resources.focusRemaining).toBeGreaterThan(0)

    render(<PatternNotice />)
    expect(screen.getByRole('button', { name: /^Form the hypothesis/ })).toBeEnabled()
    expect(screen.queryByText('No attention left this week.')).toBeNull()
  })

  it('disables the offer and says why once the week is spent', () => {
    // Spend the week directly: the property under test is the notice's
    // response to zero attention, not the route by which it reached zero.
    useGameStore.setState((store) => ({
      state: store.state ? { ...store.state, resources: { ...store.state.resources, focusRemaining: 0 } } : store.state,
    }))

    render(<PatternNotice />)
    expect(screen.getByRole('button', { name: /^Form the hypothesis/ })).toBeDisabled()
    expect(screen.getByText('No attention left this week.')).toBeVisible()
  })
})
