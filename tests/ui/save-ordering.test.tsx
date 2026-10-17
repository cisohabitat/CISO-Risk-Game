// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as Persistence from '@/store/persistence'

const io = vi.hoisted(() => ({
  blockNext: false,
  failNext: false,
  started: [] as number[],
  completed: [] as number[],
  release: undefined as (() => void) | undefined,
}))
vi.mock('@/store/persistence', async (original) => {
  const actual = await original<typeof Persistence>()
  return {
    ...actual,
    writeCampaign: vi.fn(async (state: { currentDay: number }) => {
      io.started.push(state.currentDay)
      if (io.blockNext) {
        io.blockNext = false
        await new Promise<void>((resolve) => { io.release = resolve })
      }
      if (io.failNext) {
        io.failNext = false
        throw new Error('simulated write failure')
      }
      io.completed.push(state.currentDay)
    }),
  }
})
const { useGameStore } = await import('@/store/game-store')

beforeEach(() => {
  io.blockNext = false
  io.failNext = false
  io.started = []
  io.completed = []
  io.release = undefined
})

describe('save ordering', () => {
  it('keeps a slow initial save ahead of saves requested after advancing', async () => {
    io.blockNext = true
    const opening = useGameStore.getState().startNewGame('ui-save-order', 'ciso')
    await vi.waitFor(() => expect(io.release).toBeTypeOf('function'))
    useGameStore.getState().advanceDays(30)
    const latestDay = useGameStore.getState().state!.currentDay
    expect(latestDay).toBeGreaterThan(1)
    const manual = useGameStore.getState().saveManual()
    try {
      // Let later validation/import microtasks finish while the first disk
      // write is deliberately blocked. They must not start another write.
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(io.started).toEqual([1])
    } finally {
      io.release!()
      await Promise.all([opening, manual])
    }
    expect(io.completed.at(-1)).toBe(latestDay)
    expect(io.completed).toEqual([...io.completed].sort((a, b) => a - b))
  })

  it('reports a failed save to its caller and still permits the next save', async () => {
    await useGameStore.getState().startNewGame('ui-save-after-failure', 'ciso')
    io.completed = []
    io.failNext = true
    await expect(useGameStore.getState().saveManual()).rejects.toThrow('simulated write failure')
    await useGameStore.getState().saveManual()
    expect(io.completed).toEqual([1])
  })
})
