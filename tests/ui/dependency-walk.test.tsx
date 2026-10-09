// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { OrganisationScreen } from '@/screens/organisation/OrganisationScreen'
import { discoveredNodes } from '@/store/selectors'

/**
 * Phase 4 of docs/ROADMAP.md: the graph's equivalent for a keyboard or a
 * screen reader is a walk from system to system. Following a link used to
 * replace the panel under the keyboard and drop focus to the page.
 */
describe('walking the estate without the graph', () => {
  it('moves focus to where the walk arrives, and keeps the way back', async () => {
    await useGameStore.getState().startNewGame('ui-walk', 'ciso')
    useGameStore.setState((store) => ({ ui: { ...store.ui, graphMode: 'list' } }))
    const { state, index } = useGameStore.getState()
    const start = discoveredNodes(state!, index!).find((node) => node.dependencies.length > 0)!
    const next = start.dependencies[0]!

    render(<OrganisationScreen />)
    fireEvent.click(within(screen.getByRole('list', { name: 'Discovered systems' })).getAllByText(start.name)[0]!)
    expect(screen.getByTestId('inspector-heading')).toHaveTextContent(start.name)
    // Picked from the list: the start of a walk, so no trail yet.
    expect(screen.queryByTestId('walk-trail')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: next.name }))
    const heading = screen.getByTestId('inspector-heading')
    expect(heading).toHaveTextContent(next.name)
    expect(document.activeElement).toBe(heading)
    const trail = screen.getByRole('navigation', { name: 'Your walk through the estate' })
    expect(within(trail).getByText(next.name)).toHaveAttribute('aria-current', 'location')

    // Back along the walk, by the trail.
    fireEvent.click(within(trail).getByRole('button', { name: start.name }))
    expect(screen.getByTestId('inspector-heading')).toHaveTextContent(start.name)
    expect(document.activeElement).toBe(screen.getByTestId('inspector-heading'))
    expect(screen.queryByTestId('walk-trail')).toBeNull()
  })
})
