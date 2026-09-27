/**
 * The application store is an adapter around the engine, not the engine itself
 * (plan §32.4). It owns UI state and persistence; every change to the canonical
 * game state goes through the orchestrator.
 */
import { create } from 'zustand'
import { produce } from 'immer'
import type { ContentIndex, Difficulty, GameState } from '@/game/types'
import type { ActionResult, PlayerAction, TickResult } from '@/game/engine/orchestrator'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { loadCampaign } from '@/lib/content/loader'
import { buildAnnualReview } from '@/game/debrief/review'
import { clearSaves, deleteCampaign, listSaves, readSave, type SaveKey, type SaveSummary, writeCampaign } from './persistence'

export type Screen = 'home' | 'inbox' | 'risk' | 'organisation' | 'programmes' | 'team' | 'board' | 'debrief'

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'success' | 'warning'
}

export interface UiState {
  screen: Screen
  selectedNodeId?: string
  selectedScenarioId?: string
  selectedMessageId?: string
  selectedProgrammeId?: string
  openDecisionId?: string
  graphMode: 'graph' | 'list'
  glossaryOpen: boolean
  glossaryTerm?: string
  toasts: Toast[]
  saves: SaveSummary[]
  storageWarning?: string
}

interface GameStore {
  index: ContentIndex
  state: GameState | null
  ui: UiState
  lastTicks: TickResult[]
  busy: boolean

  startNewGame: (seed: string, difficulty: Difficulty, situation?: string) => Promise<void>
  loadGame: (key: SaveKey) => Promise<boolean>
  loadImported: (state: GameState) => void
  refreshSaves: () => Promise<void>
  saveManual: () => Promise<void>
  deleteCampaign: (gameId: string) => Promise<void>
  deleteAllSaves: () => Promise<void>

  dispatch: (action: PlayerAction) => ActionResult
  advanceDays: (days: number) => TickResult[]
  setScreen: (screen: Screen) => void
  setUi: (patch: Partial<UiState>) => void
  pushToast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  openGlossary: (term?: string) => void
  finishCampaign: () => void
}

let toastId = 0

/** Autosave on the transitions that matter, never on every tick (plan §32.8). */
function shouldAutosave(action: PlayerAction, ticks: TickResult[]): boolean {
  if (ticks.some((tick) => tick.shouldAutosave)) return true
  switch (action.type) {
    case 'resolveDecision':
    case 'startProgramme':
    case 'startInvestigation':
    case 'acceptRisk':
    case 'convertHypothesis':
    case 'completeQuarterReview':
    case 'finishCampaign':
      return true
    default:
      return false
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  index: loadCampaign(),
  state: null,
  lastTicks: [],
  busy: false,
  ui: {
    screen: 'home',
    graphMode: 'graph',
    glossaryOpen: false,
    toasts: [],
    saves: [],
  },

  async startNewGame(seed, difficulty, situation) {
    const { index } = get()
    const state = newGame(index, {
      seed,
      difficulty,
      situation,
      gameId: `game-${seed}-${Date.now().toString(36)}`,
      createdAtIso: new Date().toISOString(),
    })
    set({ state, lastTicks: [], ui: { ...get().ui, screen: 'home', selectedMessageId: undefined } })
    try {
      await writeCampaign(state, index.content.meta.title)
      await get().refreshSaves()
    } catch {
      set((store) => ({ ui: { ...store.ui, storageWarning: 'Progress cannot be saved on this device.' } }))
    }
  },

  async loadGame(key) {
    try {
      const state = await readSave(key)
      if (!state) return false
      set({ state, ui: { ...get().ui, screen: 'home' } })
      return true
    } catch (error) {
      get().pushToast(error instanceof Error ? error.message : 'That save could not be loaded.', 'warning')
      return false
    }
  },

  loadImported(state) {
    set({ state, ui: { ...get().ui, screen: 'home' } })
    void writeCampaign(state, get().index.content.meta.title, { savedByPlayer: true })
    void get().refreshSaves()
  },

  async refreshSaves() {
    try {
      const saves = await listSaves()
      set((store) => ({ ui: { ...store.ui, saves } }))
    } catch {
      /* storage unavailable: the game still plays, it just cannot resume. */
    }
  },

  async deleteCampaign(gameId) {
    try {
      const removed = await deleteCampaign(gameId)
      await get().refreshSaves()
      get().pushToast(removed === 1 ? 'Campaign deleted.' : `Campaign deleted (${removed} saves).`, 'success')
    } catch {
      get().pushToast('That campaign could not be deleted.', 'warning')
    }
  },

  async deleteAllSaves() {
    try {
      await clearSaves()
      await get().refreshSaves()
      get().pushToast('All saved campaigns deleted.', 'success')
    } catch {
      get().pushToast('The saved campaigns could not be deleted.', 'warning')
    }
  },

  async saveManual() {
    const { state, index } = get()
    if (!state) return
    await writeCampaign(state, index.content.meta.title, { savedByPlayer: true })
    await get().refreshSaves()
    get().pushToast('Campaign saved.', 'success')
  },

  dispatch(action) {
    const { state, index } = get()
    if (!state) return { ok: false, message: 'No campaign is running.' }

    let result: ActionResult = { ok: false, message: '' }
    const next = produce(state, (draft) => {
      result = applyAction(draft, index, action)
    })

    if (!result.ok) {
      get().pushToast(result.message, 'warning')
      return result
    }

    set({ state: next, lastTicks: result.ticks ?? [] })
    if (result.message) get().pushToast(result.message, 'info')

    if (shouldAutosave(action, result.ticks ?? [])) {
      void writeCampaign(next, index.content.meta.title).then(() => get().refreshSaves())
    }
    return result
  },

  advanceDays(days) {
    const result = get().dispatch({ type: 'advance', days })
    return result.ticks ?? []
  },

  setScreen(screen) {
    set((store) => ({ ui: { ...store.ui, screen } }))
  },

  setUi(patch) {
    set((store) => ({ ui: { ...store.ui, ...patch } }))
  },

  pushToast(message, tone = 'info') {
    toastId += 1
    const toast: Toast = { id: toastId, message, tone }
    set((store) => ({ ui: { ...store.ui, toasts: [...store.ui.toasts, toast].slice(-3) } }))
  },

  dismissToast(id) {
    set((store) => ({ ui: { ...store.ui, toasts: store.ui.toasts.filter((toast) => toast.id !== id) } }))
  },

  openGlossary(term) {
    set((store) => ({ ui: { ...store.ui, glossaryOpen: true, glossaryTerm: term } }))
  },

  finishCampaign() {
    const { state, index } = get()
    if (!state) return
    const next = produce(state, (draft) => {
      draft.finished = true
      draft.reviews.annual = buildAnnualReview(draft, index)
    })
    set({ state: next, ui: { ...get().ui, screen: 'debrief' } })
    void writeCampaign(next, index.content.meta.title)
  },
}))
