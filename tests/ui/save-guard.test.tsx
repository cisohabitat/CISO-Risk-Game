// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as Persistence from '@/store/persistence'

const written = vi.hoisted(() => ({ count: 0 }))
vi.mock('@/store/persistence', async (original) => {
  const actual = await original<typeof Persistence>()
  return { ...actual, writeCampaign: vi.fn(async () => { written.count += 1 }) }
})

const { useGameStore } = await import('@/store/game-store')
const { onProblem } = await import('@/store/problems')

/**
 * Phase 5 of docs/ROADMAP.md: one save per campaign means a write that
 * catches the game broken replaces the only good copy. A broken state is not
 * written; the player is told, once, and the save they have is kept.
 */
describe('a broken campaign is not saved over a good one', () => {
  beforeEach(async () => {
    await useGameStore.getState().startNewGame('ui-save-guard', 'ciso')
    useGameStore.setState((store) => ({ ui: { ...store.ui, toasts: [] } }))
    written.count = 0
  })

  it('writes a sound campaign', async () => {
    await useGameStore.getState().saveManual()
    expect(written.count).toBe(1)
    expect(useGameStore.getState().ui.toasts.at(-1)?.message).toBe('Campaign saved.')
  })

  it('refuses a broken one, says so once, and reports it', async () => {
    const problems: string[] = []
    const stop = onProblem((problem) => problems.push(problem.kind))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useGameStore.setState((store) => ({ state: { ...store.state!, currentDay: 9999 } }))

    await useGameStore.getState().saveManual()
    await useGameStore.getState().saveManual()
    expect(written.count).toBe(0)
    expect(problems).toEqual(['save-refused', 'save-refused'])
    const told = useGameStore.getState().ui.toasts.filter((toast) => toast.message.includes('was not saved'))
    expect(told).toHaveLength(1)
    expect(useGameStore.getState().ui.toasts.some((toast) => toast.message === 'Campaign saved.')).toBe(false)
    stop()
  })
})

describe('import validation before activation', () => {
  it('keeps the running campaign and does not write an invalid or foreign save', async () => {
    await useGameStore.getState().startNewGame('import-protected', 'ciso')
    const previous = useGameStore.getState().state!
    written.count = 0
    for (const patch of [{ currentDay: 9999 }, { resources: null }, { contentId: 'foreign' }]) {
      const imported = { ...previous, ...patch } as unknown as typeof previous
      expect(await useGameStore.getState().loadImported(imported)).toBe(false)
      expect(useGameStore.getState().state).toBe(previous)
      expect(written.count).toBe(0)
    }
    expect(useGameStore.getState().ui.toasts.at(-1)?.message).toContain('saved progress were kept')
  })
})
