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
  /**
   * The campaign content, loaded on demand rather than with the first screen:
   * it is most of what a first-time player would otherwise wait for, and the
   * start screen needs none of it. It is always present while a campaign is.
   */
  index: ContentIndex | null
  state: GameState | null
  ui: UiState
  lastTicks: TickResult[]
  busy: boolean

  /** Loads the campaign content if it is not loaded yet. Safe to call early and often. */
  ensureCampaign: () => Promise<ContentIndex>
  startNewGame: (seed: string, difficulty: Difficulty, situation?: string) => Promise<void>
  loadGame: (key: SaveKey) => Promise<boolean>
  /** Opens an imported campaign; false if the content could not be loaded. */
  loadImported: (state: GameState) => Promise<boolean>
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
  /** Saves and closes the campaign, back to the start screen. */
  leaveCampaign: () => Promise<void>
}

let toastId = 0
let loadingCampaign: Promise<ContentIndex> | undefined
const CAMPAIGN_UNAVAILABLE = 'The campaign could not be loaded. Check the connection and try again.'

/** The content of the running campaign; there is no campaign without it. */
function contentOf(index: ContentIndex | null): ContentIndex {
  if (!index) throw new Error('The campaign content is not loaded.')
  return index
}

/**
 * Whether an action is worth writing to storage straight away (plan §32.8).
 * Every action is classified here, so a new one cannot be added without
 * deciding. The list used to name seven, and clearing a blocker, accelerating
 * a programme, hiring or meeting an executive (budget, goodwill and attention
 * spent) was lost with the tab until the next weekly save. Only the frequent
 * and trivial are left to that save; advancing time is decided by its ticks.
 */
const SAVES_ON: Record<PlayerAction['type'], boolean> = {
  advance: false,
  setSpeed: false,
  markRead: false,
  markEvidenceRead: false,
  resolveDecision: true,
  startInvestigation: true,
  createHypothesis: true,
  attachEvidence: true,
  detachEvidence: true,
  convertHypothesis: true,
  rejectHypothesis: true,
  openRisk: true,
  acceptRisk: true,
  treatRisk: true,
  escalateRisk: true,
  startProgramme: true,
  setProgrammeStatus: true,
  accelerateProgramme: true,
  resolveProgrammeBlocker: true,
  meetStakeholder: true,
  hire: true,
  completeQuarterReview: true,
  dismissPattern: true,
  dismissTutorial: true,
  finishCampaign: true,
}

/** Autosave on the transitions that matter, never on every tick. */
export function shouldAutosave(action: PlayerAction, ticks: TickResult[]): boolean {
  return ticks.some((tick) => tick.shouldAutosave) || SAVES_ON[action.type]
}

export const useGameStore = create<GameStore>((set, get) => ({
  index: null,
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

  async ensureCampaign() {
    const loaded = get().index
    if (loaded) return loaded
    const attempt = (loadingCampaign ??= import('@/lib/content/loader').then((loader) => loader.loadCampaign()))
    try {
      const index = await attempt
      set({ index })
      return index
    } catch (error) {
      // A failed fetch (offline, a deploy mid-session) must not stick, but
      // only this attempt is forgotten: a newer one may already be under way.
      if (loadingCampaign === attempt) loadingCampaign = undefined
      // In development this is where an authoring mistake arrives.
      console.error(error)
      throw error
    }
  },

  async startNewGame(seed, difficulty, situation) {
    let index: ContentIndex
    try {
      index = await get().ensureCampaign()
    } catch {
      get().pushToast(CAMPAIGN_UNAVAILABLE, 'warning')
      return
    }
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
      try {
        await get().ensureCampaign()
      } catch {
        get().pushToast(CAMPAIGN_UNAVAILABLE, 'warning')
        return false
      }
      set({ state, ui: { ...get().ui, screen: 'home' } })
      return true
    } catch (error) {
      get().pushToast(error instanceof Error ? error.message : 'That save could not be loaded.', 'warning')
      return false
    }
  },

  async loadImported(state) {
    let index: ContentIndex
    try {
      index = await get().ensureCampaign()
    } catch {
      get().pushToast(CAMPAIGN_UNAVAILABLE, 'warning')
      return false
    }
    set({ state, ui: { ...get().ui, screen: 'home' } })
    void writeCampaign(state, index.content.meta.title, { savedByPlayer: true })
    void get().refreshSaves()
    return true
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
    await writeCampaign(state, contentOf(index).content.meta.title, { savedByPlayer: true })
    await get().refreshSaves()
    get().pushToast('Campaign saved.', 'success')
  },

  dispatch(action) {
    const { state } = get()
    if (!state) return { ok: false, message: 'No campaign is running.' }
    const index = contentOf(get().index)

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
    // Two at most. Three stacked over the middle of the page, on top of the
    // cards a player was about to read, after answering decisions in a row.
    set((store) => ({ ui: { ...store.ui, toasts: [...store.ui.toasts, toast].slice(-2) } }))
  },

  dismissToast(id) {
    set((store) => ({ ui: { ...store.ui, toasts: store.ui.toasts.filter((toast) => toast.id !== id) } }))
  },

  openGlossary(term) {
    set((store) => ({ ui: { ...store.ui, glossaryOpen: true, glossaryTerm: term } }))
  },

  finishCampaign() {
    const { state } = get()
    if (!state) return
    const index = contentOf(get().index)
    const next = produce(state, (draft) => {
      draft.finished = true
      draft.reviews.annual = buildAnnualReview(draft, index)
    })
    set({ state: next, ui: { ...get().ui, screen: 'debrief' } })
    void writeCampaign(next, index.content.meta.title)
  },

  // A finished year had no way out: the start screen only shows when no
  // campaign is loaded, and nothing unloaded one short of reloading the page.
  async leaveCampaign() {
    const { state, index } = get()
    if (state) {
      try {
        await writeCampaign(state, contentOf(index).content.meta.title)
      } catch {
        // Already saved when the year closed; leaving is still allowed.
      }
    }
    set({ state: null, lastTicks: [], ui: { ...get().ui, screen: 'home', selectedMessageId: undefined, openDecisionId: undefined } })
    await get().refreshSaves()
  },
}))

/** The campaign content, for components that only render inside a campaign. */
export function useCampaignIndex(): ContentIndex {
  return contentOf(useGameStore((store) => store.index))
}
