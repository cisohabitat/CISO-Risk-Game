/**
 * The application store is an adapter around the engine, not the engine itself
 * (plan §32.4). It owns UI state and persistence; every change to the canonical
 * game state goes through the orchestrator.
 */
import type { DecisionReaction } from './decision-reactions'
import { create } from 'zustand'
import { produce } from 'immer'
import { DAYS_PER_QUARTER, DAYS_PER_WEEK } from '@/game/types'
import type { ContentIndex, Difficulty, GameState } from '@/game/types'
import type { ActionResult, PlayerAction, TickResult } from '@/game/engine/orchestrator'
import type { beginNextYear as buildFollowingYear } from '@/game/engine/next-year'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import {
  clearSaves,
  deleteCampaign,
  gameIdOfKey,
  listSaves,
  readBackup,
  readSave,
  type SaveKey,
  type SaveSummary,
  writeCampaign,
} from './persistence'
import { reportProblem } from './problems'
import { DECEMBER_START_DAY, formatGameDate } from '@/game/time'

export type Screen = 'home' | 'inbox' | 'risk' | 'organisation' | 'programmes' | 'team' | 'board' | 'debrief'

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'success' | 'warning'
}

export interface DecisionReceipt {
  gameId: string
  year: number
  day: number
  title: string
  choice: string
  budgetChange: number
  attentionChange: number
  unfundedChange: number
  messageIds: string[]
  evidenceIds: string[]
  /** Reactions the player can already see elsewhere (`decision-reactions.ts`). */
  reactions?: DecisionReaction[]
}

export interface QuarterTransition {
  gameId: string
  year: number
  quarter: number
}

export interface UiState {
  /** Final-month correspondence offered before navigating to the played year's review. */
  yearEndUpdates?: { gameId: string; year: number; messageIds: string[] }
  /** Ephemeral confirmations, never written into a campaign save. */
  decisionReceipt?: DecisionReceipt
  quarterTransition?: QuarterTransition
  screen: Screen
  riskTab?: string
  boardDraft?: { quarter: number; topics: string[]; recommendations: string[]; uncertainty: boolean }
  selectedNodeId?: string
  selectedScenarioId?: string
  selectedMessageId?: string
  selectedProgrammeId?: string
  openDecisionId?: string
  graphMode: 'graph' | 'list'
  glossaryOpen: boolean
  glossaryTerm?: string
  toasts: Toast[]
  savesReady: boolean
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
  /** Loads the campaign; `yearTwo` adds what only a second year says. */
  ensureCampaign: (options?: { yearTwo?: boolean }) => Promise<ContentIndex>
  startNewGame: (seed: string, difficulty: Difficulty, situation?: string) => Promise<void>
  loadGame: (key: SaveKey) => Promise<boolean>
  /** Opens an imported campaign only after validation; preserves play on rejection. */
  loadImported: (state: GameState) => Promise<boolean>
  refreshSaves: () => Promise<void>
  saveManual: () => Promise<void>
  deleteCampaign: (gameId: string) => Promise<void>
  deleteAllSaves: () => Promise<void>

  dispatch: (action: PlayerAction) => ActionResult
  advanceDays: (days: number, stopOnUpdate?: boolean) => TickResult[]
  setScreen: (screen: Screen) => void
  setUi: (patch: Partial<UiState>) => void
  pushToast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  openGlossary: (term?: string) => void
  finishCampaign: () => Promise<void>
  /** Saves and closes the campaign, back to the start screen. */
  leaveCampaign: () => Promise<void>
  /** The year after a finished one, as a campaign of its own; the finished year's save stays as it was. */
  beginNextYear: () => Promise<void>
}

let toastId = 0
let loadingCampaign: Promise<ContentIndex> | undefined
let loadingBothYears: Promise<ContentIndex> | undefined

/**
 * Whether an index carries Year Two's content, which loads on its own when a
 * second year needs it (`src/lib/content/loader.ts`). Read from a decision only
 * a second year has, so the store need not import the loader to ask.
 */
function hasYearTwo(index: ContentIndex): boolean {
  return index.decision.has('dec-y2-focus')
}

/** A second-year save cannot be checked, or played, without Year Two. */
function needsYearTwo(state: GameState): boolean {
  return (state.year ?? 1) > 1
}
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
  reaffirmAssumption: true,
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

/**
 * The engine's own invariants, loaded with the first save rather than with the
 * first screen. A state that fails them is a defect, and writing it would
 * replace the last good save of the campaign with a broken one.
 */
async function brokenRules(state: GameState, index: ContentIndex): Promise<string[]> {
  const [{ checkInvariants }, { saveSafety }] = await Promise.all([import('@/game/engine/invariants'), import('./save-safety')])
  const unsafe = saveSafety(state, index)
  if (unsafe.length) return unsafe
  return checkInvariants(state, index).map((violation) => `${violation.rule}: ${violation.detail}`)
}

let savedListRequests = 0
let savedListSequence = 0
let refusedThisSession = false
let pendingSave: Promise<void> = Promise.resolve()

/** Validation imports and disk writes must retain the order of player actions.
 * A slow initial save otherwise can land after newer autosaves and roll back
 * the primary record. A failed operation rejects its caller, not the queue. */
function saveSafely(...args: Parameters<typeof saveSnapshot>): Promise<boolean> {
  const queued = pendingSave.then(() => saveSnapshot(...args))
  pendingSave = queued.then(() => undefined, () => undefined)
  return queued
}

/**
 * Write the campaign, unless it is broken (docs/ROADMAP.md, Phase 5). The
 * player is told once; the save they already have is kept.
 */
async function saveSnapshot(
  state: GameState,
  index: ContentIndex,
  options: { savedByPlayer?: boolean } = {},
  tell: (message: string) => void = () => {},
): Promise<boolean> {
  const broken = await brokenRules(state, index)
  if (broken.length > 0) {
    reportProblem({ kind: 'save-refused', detail: `day ${state.currentDay}: ${broken.slice(0, 3).join('; ')}` })
    if (!refusedThisSession) {
      refusedThisSession = true
      tell('Something in the campaign went wrong, so this moment was not saved. Your last save is kept.')
    }
    return false
  }
  await writeCampaign(state, index.content.meta.title, options)
  return true
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
    savesReady: false,
  },

  async ensureCampaign({ yearTwo = false } = {}) {
    const loaded = get().index
    if (loaded && (!yearTwo || hasYearTwo(loaded))) return loaded
    const attempt = yearTwo
      ? (loadingBothYears ??= import('@/lib/content/loader').then((loader) => loader.loadCampaign({ yearTwo: true })))
      : (loadingCampaign ??= import('@/lib/content/loader').then((loader) => loader.loadCampaign()))
    try {
      const index = await attempt
      // A first-year load that finishes after the full one must not replace it.
      const current = get().index
      if (!current || !hasYearTwo(current)) set({ index })
      return get().index ?? index
    } catch (error) {
      // A failed fetch (offline, a deploy mid-session) must not stick, but
      // only this attempt is forgotten: a newer one may already be under way.
      if (loadingCampaign === attempt) loadingCampaign = undefined
      if (loadingBothYears === attempt) loadingBothYears = undefined
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
    set({ state, lastTicks: [], ui: { ...get().ui, yearEndUpdates: undefined, decisionReceipt: undefined, quarterTransition: undefined, boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined, glossaryOpen: false, glossaryTerm: undefined, screen: 'home', selectedMessageId: undefined } })
    try {
      await saveSafely(state, index)
      await get().refreshSaves()
    } catch {
      set((store) => ({ ui: { ...store.ui, storageWarning: 'Progress cannot be saved on this device.' } }))
    }
  },

  async loadGame(key) {
    let index: ContentIndex
    try {
      index = await get().ensureCampaign()
    } catch {
      get().pushToast(CAMPAIGN_UNAVAILABLE, 'warning')
      return false
    }
    let state: GameState | undefined
    let failure: unknown
    try {
      state = await readSave(key)
      if (state && needsYearTwo(state)) {
        // A failed download is not a damaged save: say so, and keep the backup.
        try {
          index = await get().ensureCampaign({ yearTwo: true })
        } catch {
          get().pushToast(CAMPAIGN_UNAVAILABLE, 'warning')
          return false
        }
      }
      if (state && (await brokenRules(state, index)).length > 0) {
        failure = new Error('The save failed its own checks.')
        state = undefined
      }
    } catch (error) {
      failure = error
    }
    // A save that will not open, or opens broken, falls back to the one
    // before it, and says so rather than losing the year.
    if (!state && failure) {
      const gameId = gameIdOfKey(key)
      const backup = gameId ? await readBackup(gameId).catch(() => undefined) : undefined
      if (backup && needsYearTwo(backup)) {
        try {
          index = await get().ensureCampaign({ yearTwo: true })
        } catch {
          get().pushToast(CAMPAIGN_UNAVAILABLE, 'warning')
          return false
        }
      }
      if (backup && (await brokenRules(backup, index)).length === 0) {
        reportProblem({ kind: 'save-recovered', detail: `${key}: ${failure instanceof Error ? failure.message : String(failure)}` })
        set({ state: backup, ui: { ...get().ui, yearEndUpdates: undefined, decisionReceipt: undefined, quarterTransition: undefined, boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined, glossaryOpen: false, glossaryTerm: undefined, screen: 'home' } })
        get().pushToast(
          `That save was damaged, so the campaign opened from the one before it, on ${formatGameDate(backup.currentDay).label}.`,
          'warning',
        )
        return true
      }
      get().pushToast(failure instanceof Error ? failure.message : 'That save could not be loaded.', 'warning')
      return false
    }
    if (!state) return false
    set({ state, ui: { ...get().ui, yearEndUpdates: undefined, decisionReceipt: undefined, quarterTransition: undefined, boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined, glossaryOpen: false, glossaryTerm: undefined, screen: 'home' } })
    return true
  },

  async loadImported(state) {
    let index: ContentIndex
    try {
      index = await get().ensureCampaign({ yearTwo: needsYearTwo(state) })
    } catch {
      get().pushToast(CAMPAIGN_UNAVAILABLE, 'warning')
      return false
    }
    try {
      if (state.contentId !== index.content.meta.id || (await brokenRules(state, index)).length > 0) {
        throw new Error('Invalid save')
      }
    } catch {
      get().pushToast('That save failed validation. Your current campaign and saved progress were kept.', 'warning')
      return false
    }
    set({ state, ui: { ...get().ui, yearEndUpdates: undefined, decisionReceipt: undefined, quarterTransition: undefined, boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined, glossaryOpen: false, glossaryTerm: undefined, screen: 'home' } })
    void saveSafely(state, index, { savedByPlayer: true }, (message) => get().pushToast(message, 'warning')).then(() => get().refreshSaves())
    return true
  },

  async refreshSaves() {
    const sequence = ++savedListSequence
    savedListRequests += 1
    set((store) => ({ ui: { ...store.ui, savesReady: false } }))
    try {
      const saves = await listSaves()
      if (sequence === savedListSequence) set((store) => ({ ui: { ...store.ui, saves } }))
    } catch {
      if (sequence === savedListSequence) get().pushToast('Saved campaigns could not be listed. Reload to retry; existing saves were kept.', 'warning')
    } finally {
      savedListRequests -= 1
      if (savedListRequests === 0) set((store) => ({ ui: { ...store.ui, savesReady: true } }))
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
    const saved = await saveSafely(state, contentOf(index), { savedByPlayer: true }, (message) => get().pushToast(message, 'warning'))
    await get().refreshSaves()
    if (saved) get().pushToast('Campaign saved.', 'success')
  },

  dispatch(action) {
    const { state } = get()
    if (!state) return { ok: false, message: 'No campaign is running.' }
    const index = contentOf(get().index)

    let result: ActionResult = { ok: false, message: '' }
    const fast = state.speed === '2x' || state.speed === '4x'
    let weeklyHold = false
    const next = produce(state, (draft) => {
      const request = fast && action.type === 'advance'
        ? { ...action, days: Math.min(action.days, DAYS_PER_WEEK - state.currentDay % DAYS_PER_WEEK) }
        : action
      result = applyAction(draft, index, request)
      if (fast) {
        weeklyHold = result.ok && !draft.finished && action.type === 'advance' && draft.resources.weekIndex > state.resources.weekIndex
        if (weeklyHold || (action.type !== 'advance' && action.type !== 'setSpeed')) {
          applyAction(draft, index, { type: 'setSpeed', speed: 'paused' })
        }
      }
    })

    if (!result.ok) {
      if (fast) set({ state: produce(state, (draft) => { applyAction(draft, index, { type: 'setSpeed', speed: 'paused' }) }) })
      get().pushToast(result.message, 'warning')
      return result
    }

    const quarter = Math.min(4, Math.floor(next.currentDay / DAYS_PER_QUARTER) + 1)
    const previousQuarter = Math.min(4, Math.floor(state.currentDay / DAYS_PER_QUARTER) + 1)
    set({ state: next, lastTicks: result.ticks ?? [], ui: {
      ...get().ui,
      ...(next.currentDay !== state.currentDay ? { decisionReceipt: undefined } : {}),
      ...(next.finished && !state.finished ? { yearEndUpdates: { gameId: next.gameId, year: next.year ?? 1, messageIds: next.inbox.messages.filter((message) => message.day >= DECEMBER_START_DAY).map((message) => message.id) }, screen: 'inbox' as const, selectedMessageId: next.inbox.messages.find((message) => message.day >= DECEMBER_START_DAY)?.id } : {}),
      ...(quarter > previousQuarter && !next.finished ? {
        quarterTransition: { gameId: next.gameId, year: next.year ?? 1, quarter },
      } : {}),
    } })
    if (result.message) get().pushToast(result.message, 'info')
    if (weeklyHold) get().pushToast('A new week: attention has renewed. Time is held so you can choose how to use it. Select a speed to continue.', 'info')

    if (shouldAutosave(action, result.ticks ?? [])) {
      void saveSafely(next, index, {}, (message) => get().pushToast(message, 'warning')).then(() => get().refreshSaves())
    }
    return result
  },

  advanceDays(days, stopOnUpdate) {
    const result = get().dispatch({ type: 'advance', days, ...(stopOnUpdate ? { stopOnUpdate: true } : {}) })
    return result.ticks ?? []
  },

  setScreen(screen) {
    set((store) => ({ ui: { ...store.ui, screen, ...(screen === 'debrief' ? { yearEndUpdates: undefined } : {}), ...(screen !== 'risk' ? { riskTab: undefined } : {}) } }))
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

  async finishCampaign() {
    // The review loads with the year's end, not with the first screen.
    const { finishYear } = await import('@/game/debrief/review')
    const { state } = get()
    if (!state || state.reviews.annual) return
    const index = contentOf(get().index)
    const next = produce(state, (draft) => finishYear(draft, index))
    const handover = get().ui.yearEndUpdates
    const holdsReview = handover?.gameId === next.gameId && handover.year === (next.year ?? 1)
    set({ state: next, ui: { ...get().ui, boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined, glossaryOpen: false, glossaryTerm: undefined, screen: holdsReview ? 'inbox' : 'debrief' } })
    void saveSafely(next, index, {}, (message) => get().pushToast(message, 'warning'))
  },

  async beginNextYear() {
    const source = get().state
    if (!source?.finished || !source.reviews.annual) return
    let beginNextYear: typeof buildFollowingYear
    let content: ContentIndex
    try {
      const [module, full] = await Promise.all([import('@/game/engine/next-year'), get().ensureCampaign({ yearTwo: true })])
      beginNextYear = module.beginNextYear
      content = full
    } catch {
      if (get().state === source) get().pushToast('The next year could not load. Export this campaign before reloading to try again.', 'warning')
      return
    }
    const { state } = get()
    // A second click or a different loaded campaign must not start another year.
    if (state !== source) return
    const next = beginNextYear(content, state)
    set({ state: next, lastTicks: [], ui: { ...get().ui, yearEndUpdates: undefined, decisionReceipt: undefined, quarterTransition: undefined, boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined, glossaryOpen: false, glossaryTerm: undefined, screen: 'home', selectedMessageId: undefined } })
    try {
      await saveSafely(next, content, {}, (message) => get().pushToast(message, 'warning'))
      await get().refreshSaves()
    } catch {
      set((store) => ({ ui: { ...store.ui, storageWarning: 'Progress cannot be saved on this device.' } }))
    }
  },

  // A finished year had no way out: the start screen only shows when no
  // campaign is loaded, and nothing unloaded one short of reloading the page.
  async leaveCampaign() {
    const { state, index } = get()
    if (state) {
      try {
        await saveSafely(state, contentOf(index))
      } catch {
        // Already saved when the year closed; leaving is still allowed.
      }
    }
    set({ state: null, lastTicks: [], ui: { ...get().ui, yearEndUpdates: undefined, decisionReceipt: undefined, quarterTransition: undefined, boardDraft: undefined, riskTab: undefined, selectedProgrammeId: undefined, openDecisionId: undefined, glossaryOpen: false, glossaryTerm: undefined, screen: 'home', selectedMessageId: undefined } })
    await get().refreshSaves()
  },
}))

/** The campaign content, for components that only render inside a campaign. */
export function useCampaignIndex(): ContentIndex {
  return contentOf(useGameStore((store) => store.index))
}
