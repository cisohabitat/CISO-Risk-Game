// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { InvestigationPanel } from '@/components/risk/InvestigationPanel'
import { useGameStore } from '@/store/game-store'
import { delegationQuality, teamStrain } from '@/game/team/capacity'

/**
 * The delegation dialog badged the leader "in their area" and chose them by
 * default, but what comes back reads the leader's skill, workload and morale
 * and the team's strain, never the area. A playtest chose by the badge.
 */
describe('choosing who leads an enquiry', () => {
  it('offers the leader whose work would come back best, and claims nothing about area', async () => {
    await useGameStore.getState().startNewGame('ui-delegation', 'ciso')
    const { index } = useGameStore.getState()
    // Make the best leader someone outside the first enquiry's area.
    const leaders = index!.content.leaders
    const target = leaders[leaders.length - 1]!
    useGameStore.setState((store) => {
      const next = structuredClone(store.state!)
      for (const leader of leaders) Object.assign(next.team.leaders[leader.id]!, { skill: 0.5, morale: 0.6, workload: 0.3 })
      Object.assign(next.team.leaders[target.id]!, { skill: 0.95, morale: 0.9, workload: 0 })
      return { state: next }
    })
    const strain = teamStrain(useGameStore.getState().state!)
    const best = [...leaders].sort(
      (a, b) =>
        delegationQuality(useGameStore.getState().state!.team.leaders[b.id]!, strain, 0.5) -
        delegationQuality(useGameStore.getState().state!.team.leaders[a.id]!, strain, 0.5),
    )[0]!
    expect(best.id).toBe(target.id)

    render(<InvestigationPanel />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Commission' })[0]!)
    const chosen = screen.getAllByRole('radio').find((radio) => (radio as HTMLInputElement).checked) as HTMLInputElement
    expect(chosen.value).toBe(target.id)
    expect(screen.queryByText('In their area')).toBeNull()
  })
})
