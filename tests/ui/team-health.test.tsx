// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { TeamScreen } from '@/screens/team/TeamScreen'
import { useGameStore } from '@/store/game-store'

/**
 * A playtest's Briefing said "Your functions have room to take on work"
 * through a third quarter in which engineering was burning out, and the
 * annual review was the first place that said so in a sentence.
 */
describe('the team sentence', () => {
  it('names a function that is burning out, even when there is room', async () => {
    await useGameStore.getState().startNewGame('ui-team-health', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.team.functions.engineering!.morale = 0.2
      return { state }
    })

    const briefing = render(<HomeScreen />)
    expect(screen.getByText(/but engineering is burning out\./)).toBeTruthy()
    briefing.unmount()

    render(<TeamScreen />)
    expect(screen.getByText(/but engineering is burning out/)).toBeTruthy()
  })
})
