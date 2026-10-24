// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import type { SaveSummary } from '@/store/persistence'
import type * as Persistence from '@/store/persistence'
const io = vi.hoisted(() => ({ list: vi.fn(async (): Promise<SaveSummary[]> => []) }))
vi.mock('@/store/persistence', async (original) => ({
  ...await original<typeof Persistence>(),
  writeCampaign: vi.fn(async () => {}),
  listSaves: io.list,
}))
const { useGameStore } = await import('@/store/game-store')

it('keeps the latest listing and signals readiness only after every request settles', async () => {
  await useGameStore.getState().startNewGame('list-ordering', 'ciso')
  let release!: (saves: SaveSummary[]) => void
  const older: SaveSummary = { key: 'campaign:list', gameId: 'list', seed: 'list', day: 1, difficulty: 'ciso', savedAtIso: '2026-10-24T00:00:00Z', savedByPlayer: true, schemaVersion: 4, campaignTitle: 'Test' }
  const newer = { ...older, day: 2 }
  io.list.mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
  const first = useGameStore.getState().refreshSaves()
  io.list.mockResolvedValueOnce([newer])
  await useGameStore.getState().refreshSaves()
  expect(useGameStore.getState().ui.saves).toEqual([newer])
  expect(useGameStore.getState().ui.savesReady).toBe(false)
  release([older])
  await first
  expect(useGameStore.getState().ui.saves).toEqual([newer])
  expect(useGameStore.getState().ui.savesReady).toBe(true)
})
