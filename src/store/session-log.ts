/**
 * A playtest session's own record (docs/ROADMAP.md, Phase 0): what the player
 * looked at, what they did and when, with the game day and the minutes since
 * the log began, so a facilitator can answer "how long before the first
 * enquiry?" or "where did the clock stop them?" from a file instead of from
 * memory.
 *
 * It sits outside the engine and reads nothing the engine does not already
 * expose: it wraps the store's dispatch and watches the store. It records ids,
 * never free text — a decision's optional note stays out. Nothing is sent
 * anywhere; the player exports the file and hands it over.
 */
import { useGameStore } from './game-store'
import type { PlayerAction } from '@/game/engine/orchestrator'
import { isRecording } from './session-recording'
import { onProblem } from './problems'

const KEY = 'ciso-session-log'
const LIMIT = 20_000

export interface SessionEvent {
  /** Milliseconds since the log began. */
  at: number
  /** The game day when it happened, when a campaign was open. */
  day?: number
  kind: 'campaign' | 'screen' | 'action' | 'paused' | 'glossary' | 'year-end' | 'error'
  [field: string]: unknown
}

export interface SessionLog {
  version: 1
  startedAt: string
  userAgent: string
  events: SessionEvent[]
}

function read(): SessionLog {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SessionLog
      if (parsed.version === 1 && Array.isArray(parsed.events)) return parsed
    }
  } catch {
    /* A damaged log starts again rather than stopping the game. */
  }
  return { version: 1, startedAt: new Date().toISOString(), userAgent: navigator.userAgent, events: [] }
}

let log: SessionLog | undefined

function current(): SessionLog {
  return (log ??= read())
}

export function record(kind: SessionEvent['kind'], data: Record<string, unknown> = {}): void {
  // The hooks stay installed for the life of the tab; switched off, they
  // write nothing, so a stopped log is not quietly started again.
  if (!isRecording()) return
  const target = current()
  if (target.events.length >= LIMIT) return
  const day = useGameStore.getState().state?.currentDay
  const at = Date.now() - Date.parse(target.startedAt)
  target.events.push({ at, ...(day === undefined ? {} : { day }), kind, ...data })
  try {
    localStorage.setItem(KEY, JSON.stringify(target))
  } catch {
    /* Full or blocked storage: keep recording in memory for this tab. */
  }
}

/** The action as data, minus anything the player typed. */
export function describeAction(action: PlayerAction): Record<string, unknown> {
  const { type, ...fields } = action as PlayerAction & { note?: string }
  delete fields.note
  return { type, ...fields }
}

/** Every-day ticks from the running clock are noise; a skip ahead is not. */
function worthRecording(action: PlayerAction): boolean {
  return !(action.type === 'advance' && action.days <= 1)
}

let installed = false

export function installSessionLog(): void {
  if (installed) return
  installed = true
  current()

  const original = useGameStore.getState().dispatch
  useGameStore.setState({
    dispatch: (action) => {
      const result = original(action)
      if (worthRecording(action)) record('action', { ...describeAction(action), ok: result.ok })
      return result
    },
  })

  // What went wrong, in the same file as what the player was doing when it
  // did: a refused save, a screen that failed, an uncaught error.
  onProblem((problem) => record('error', { problem: problem.kind, detail: problem.detail.slice(0, 300) }))

  let previous = useGameStore.getState()
  if (previous.state) record('campaign', campaignOf(previous.state))
  record('screen', { screen: previous.ui.screen })

  useGameStore.subscribe((next) => {
    const before = previous
    previous = next
    if (next.state && next.state.gameId !== before.state?.gameId) record('campaign', campaignOf(next.state))
    if (next.ui.screen !== before.ui.screen) record('screen', { screen: next.ui.screen })
    if (next.ui.glossaryOpen && !before.ui.glossaryOpen) record('glossary', { term: next.ui.glossaryTerm ?? null })
    const reasons = next.state?.pauseReasons ?? []
    if (reasons.length > 0 && (before.state?.pauseReasons.length ?? 0) === 0) record('paused', { reasons: [...reasons] })
    if (next.state?.finished && !before.state?.finished) record('year-end')
  })
}

function campaignOf(state: NonNullable<ReturnType<typeof useGameStore.getState>['state']>) {
  return { gameId: state.gameId, seed: state.seed, difficulty: state.difficulty, situation: state.situationId ?? null }
}

export function sessionLogJson(): string {
  return JSON.stringify(current(), null, 2)
}

export function clearSessionLog(): void {
  log = { version: 1, startedAt: new Date().toISOString(), userAgent: navigator.userAgent, events: [] }
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* Nothing to clear. */
  }
}

/** A new session: an empty log, with the open campaign and screen as its first lines. */
export function beginFresh(): void {
  clearSessionLog()
  const { state, ui } = useGameStore.getState()
  if (state) record('campaign', campaignOf(state))
  record('screen', { screen: ui.screen })
}

/** Hands the log to the player as a file. */
export function downloadSessionLog(): void {
  const blob = new Blob([sessionLogJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ciso-session-${current().startedAt.slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
