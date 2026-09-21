// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Onboarding } from '@/components/game/Onboarding'
import { useGameStore } from '@/store/game-store'

/**
 * A teaching note sat on top of the annual review on 31 December, telling a
 * player whose year was over to record what they were relying on. Lessons are
 * for a year in progress.
 */
describe('teaching notes', () => {
  it('show while the year is running and step aside once it is over', async () => {
    await useGameStore.getState().startNewGame('ui-lesson', 'guided')
    // Three weeks in, the standing lesson about attention is due. The clock
    // stops for the first decision, so the day is arranged directly: the
    // property under test is the note's response to the state, not the clock.
    useGameStore.setState((store) => ({ state: { ...store.state!, currentDay: 30 } }))
    const first = render(<Onboarding />)
    expect(screen.getByRole('button', { name: 'Got it' }), 'no lesson was showable three weeks in').toBeInTheDocument()
    first.unmount()

    useGameStore.setState((store) => ({ state: { ...store.state!, finished: true } }))
    render(<Onboarding />)
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull()
  })
})

/**
 * The opening playtest's newcomers said guided mode "stops guiding just when
 * selection complexity rises". A first-quarter aim now opens the year where
 * the profile coaches decisions, and only there: it is advice, not a mechanic.
 */
describe('the first-quarter aim', () => {
  it('opens a guided year and stays out of a CISO one', async () => {
    await useGameStore.getState().startNewGame('ui-aim', 'guided')
    const guided = render(<Onboarding />)
    expect(screen.getByText('A first quarter, in three questions')).toBeInTheDocument()
    guided.unmount()

    await useGameStore.getState().startNewGame('ui-aim', 'ciso')
    render(<Onboarding />)
    expect(screen.queryByText('A first quarter, in three questions')).toBeNull()
  })
})
