import { describe, expect, it } from 'vitest'
import { useGameStore } from '@/store/game-store'
import { situationChoices } from '@/lib/content/situations'

/**
 * The campaign content is not part of the first load: the start screen needs
 * only the situations' names, and everything else arrives when a campaign
 * opens. There must never be a campaign without its content.
 */
describe('loading the campaign on demand', () => {
  it('starts without the content, and a campaign never runs without it', async () => {
    expect(useGameStore.getState().index).toBeNull()
    await useGameStore.getState().startNewGame('lazy-load', 'ciso')
    const { index, state } = useGameStore.getState()
    expect(state).not.toBeNull()
    expect(index).not.toBeNull()
    expect(index!.content.events.length).toBeGreaterThan(100)
  })

  it('offers the start screen the same situations the campaign has', async () => {
    const index = await useGameStore.getState().ensureCampaign()
    expect(situationChoices.map((s) => [s.id, s.name, s.summary])).toEqual(
      (index.content.situations ?? []).map((s) => [s.id, s.name, s.summary]),
    )
  })
})
