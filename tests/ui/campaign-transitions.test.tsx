// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import type * as Persistence from '@/store/persistence'
import type { UiState } from '@/store/game-store'

const storage = vi.hoisted(() => ({
  readSave: vi.fn(),
  readBackup: vi.fn(),
  writeCampaign: vi.fn(async () => {}),
  listSaves: vi.fn(async () => []),
}))
vi.mock('@/store/persistence', async (original) => ({ ...await original<typeof Persistence>(), ...storage }))
const { useGameStore } = await import('@/store/game-store')

beforeEach(async () => {
  storage.readSave.mockReset()
  storage.readBackup.mockReset()
  await useGameStore.getState().startNewGame('transition-source', 'ciso')
})

function seedOpenWork(): UiState {
  const state = useGameStore.getState().state!
  useGameStore.getState().setUi({
    screen: 'board', graphMode: 'list',
    selectedMessageId: 'selected-message', selectedNodeId: 'selected-node', selectedScenarioId: 'selected-scenario',
    selectedProgrammeId: 'selected-programme', openDecisionId: 'open-decision', riskTab: 'evidence',
    boardDraft: { quarter: 1, topics: ['risk'], recommendations: ['programme'], uncertainty: true },
    glossaryOpen: true, glossaryTerm: 'gls-residual',
    decisionReceipt: { gameId: state.gameId, year: 1, day: 0, title: 'Earlier decision', choice: 'Earlier choice', budgetChange: 0, attentionChange: 0, unfundedChange: 0, messageIds: [], evidenceIds: [] },
    quarterTransition: { gameId: state.gameId, year: 1, quarter: 2 },
    yearEndUpdates: { gameId: state.gameId, year: 1, messageIds: [] },
    storageWarning: 'Existing storage notice', toasts: [{ id: 123, message: 'Existing notification', tone: 'info' }],
  })
  useGameStore.setState({ lastTicks: [{ day: 0, pauseReasons: [], highlights: ['Earlier tick'], shouldAutosave: false }] })
  return useGameStore.getState().ui
}

it.each(['new', 'saved', 'backup', 'import', 'next-year', 'leave'] as const)(
  'clears open campaign work on %s while preserving the established selection policy',
  async (transition) => {
    if (transition === 'next-year') await useGameStore.getState().finishCampaign()
    const previous = seedOpenWork()
    const state = structuredClone(useGameStore.getState().state!)
    const ticks = useGameStore.getState().lastTicks
    const store = useGameStore.getState()
    switch (transition) {
      case 'new': await store.startNewGame('transition-destination', 'guided'); break
      case 'saved':
        storage.readSave.mockResolvedValue(state)
        expect(await store.loadGame(`campaign:${state.gameId}`)).toBe(true)
        break
      case 'backup':
        storage.readSave.mockRejectedValue(new Error('Unreadable primary save'))
        storage.readBackup.mockResolvedValue(state)
        expect(await store.loadGame(`campaign:${state.gameId}`)).toBe(true)
        expect(useGameStore.getState().ui.toasts.at(-1)?.message).toContain('opened from the one before it')
        break
      case 'import': expect(await store.loadImported(state)).toBe(true); break
      case 'next-year':
        await store.beginNextYear()
        expect(useGameStore.getState().state!.year).toBe(2)
        break
      case 'leave':
        await store.leaveCampaign()
        expect(useGameStore.getState().state).toBeNull()
        break
    }
    const next = useGameStore.getState()
    expect(next.ui).toMatchObject({
      screen: 'home', glossaryOpen: false, glossaryTerm: undefined,
      yearEndUpdates: undefined, decisionReceipt: undefined, quarterTransition: undefined,
      boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined,
      graphMode: previous.graphMode, selectedNodeId: previous.selectedNodeId, selectedScenarioId: previous.selectedScenarioId,
      storageWarning: previous.storageWarning,
    })
    expect(next.ui.toasts).toContainEqual(previous.toasts[0])
    const clearsSelection = ['new', 'next-year', 'leave'].includes(transition)
    expect(next.ui.selectedMessageId).toBe(clearsSelection ? undefined : previous.selectedMessageId)
    expect(next.lastTicks).toEqual(clearsSelection ? [] : ticks)
  },
)

it('keeps the December handover and recorded feedback when preparing the annual review', async () => {
  const previous = seedOpenWork()
  await useGameStore.getState().finishCampaign()
  const next = useGameStore.getState()
  expect(next.state!.reviews.annual).toBeDefined()
  expect(next.ui.screen).toBe('inbox')
  expect(next.ui.yearEndUpdates).toBe(previous.yearEndUpdates)
  expect(next.ui.decisionReceipt).toBe(previous.decisionReceipt)
  expect(next.ui.quarterTransition).toBe(previous.quarterTransition)
  expect(next.ui.boardDraft).toBeUndefined()
  expect(next.ui.glossaryOpen).toBe(false)
})
