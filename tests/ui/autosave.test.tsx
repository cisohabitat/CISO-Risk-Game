// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const written = vi.hoisted(() => ({ count: 0 }))
vi.mock('@/store/persistence', async (original) => {
  const actual = await original<typeof import('@/store/persistence')>()
  return { ...actual, writeCampaign: vi.fn(async () => { written.count += 1 }) }
})

const { useGameStore } = await import('@/store/game-store')

/**
 * A playtest held the line with the CIO over a blocked programme, closed the
 * tab, and came back to the blocker still standing: only seven actions were
 * saved straight away, and budget, goodwill and attention spent on the others
 * waited for the next weekly save.
 */
describe('what the player does is saved when they do it', () => {
  beforeEach(async () => {
    await useGameStore.getState().startNewGame('ui-autosave', 'ciso')
    written.count = 0
  })

  it('saves after pausing a programme, meeting an executive or clearing a blocker', () => {
    const store = useGameStore.getState()
    expect(store.dispatch({ type: 'startProgramme', programmeId: 'prog-identity', budget: 850 }).ok).toBe(true)
    written.count = 0
    expect(store.dispatch({ type: 'setProgrammeStatus', programmeId: 'prog-identity', status: 'paused' }).ok).toBe(true)
    expect(written.count).toBe(1)
    const stakeholderId = useGameStore.getState().index!.content.stakeholders[0]!.id
    expect(store.dispatch({ type: 'meetStakeholder', stakeholderId, approach: 'listen' }).ok).toBe(true)
    expect(written.count).toBe(2)
  })

  it('leaves reading a message to the weekly save', () => {
    const state = useGameStore.getState().state!
    const messageId = state.inbox.messages[0]!.id
    useGameStore.getState().dispatch({ type: 'markRead', messageId })
    expect(written.count).toBe(0)
  })
})
