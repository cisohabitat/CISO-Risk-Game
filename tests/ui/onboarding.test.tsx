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
