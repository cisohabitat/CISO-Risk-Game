/**
 * The game's sounds, synthesised rather than recorded so they cost a few
 * hundred bytes instead of audio files. Each marks something that has just
 * appeared on screen: mail, a decision falling due, an incident, a quarter
 * closing, the year ending. Quiet, short, and never on a loop.
 */
import { useGameStore } from '@/store/game-store'
import { soundOn } from './sound-setting'

export type Cue = 'message' | 'decision' | 'incident' | 'quarter' | 'year' | 'confirm'

/** Notes as [frequency in Hz, start in seconds, length in seconds]. */
const CUES: Record<Cue, { wave: OscillatorType; gain: number; notes: [number, number, number][] }> = {
  message: { wave: 'sine', gain: 0.05, notes: [[880, 0, 0.09]] },
  decision: { wave: 'sine', gain: 0.06, notes: [[660, 0, 0.12], [880, 0.1, 0.16]] },
  incident: { wave: 'triangle', gain: 0.08, notes: [[220, 0, 0.28], [185, 0.26, 0.42]] },
  quarter: { wave: 'sine', gain: 0.06, notes: [[523, 0, 0.18], [659, 0.14, 0.18], [784, 0.28, 0.32]] },
  year: { wave: 'sine', gain: 0.06, notes: [[392, 0, 0.5], [494, 0.12, 0.5], [587, 0.24, 0.7]] },
  confirm: { wave: 'sine', gain: 0.05, notes: [[740, 0, 0.12]] },
}

let context: AudioContext | undefined

function audio(): AudioContext | undefined {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return undefined
  }
}

export function play(cue: Cue): void {
  if (!soundOn()) return
  const ctx = audio()
  if (!ctx) return
  const { wave, gain, notes } = CUES[cue]
  const now = ctx.currentTime
  for (const [frequency, start, length] of notes) {
    const oscillator = ctx.createOscillator()
    const envelope = ctx.createGain()
    oscillator.type = wave
    oscillator.frequency.value = frequency
    envelope.gain.setValueAtTime(0, now + start)
    envelope.gain.linearRampToValueAtTime(gain, now + start + 0.015)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + start + length)
    oscillator.connect(envelope).connect(ctx.destination)
    oscillator.start(now + start)
    oscillator.stop(now + start + length + 0.05)
  }
}

/** Which cue, if any, the change from one state to the next deserves. */
export function cueFor(
  before: { unread: number; reasons: string[]; finished: boolean },
  after: { unread: number; reasons: string[]; finished: boolean },
): Cue | undefined {
  if (after.finished && !before.finished) return 'year'
  const fresh = after.reasons.filter((reason) => !before.reasons.includes(reason))
  if (fresh.includes('incident')) return 'incident'
  if (fresh.includes('quarter-end')) return 'quarter'
  if (fresh.includes('decision-deadline') || fresh.includes('board-decision')) return 'decision'
  if (after.unread > before.unread) return 'message'
  return undefined
}

let installed = false

export function installCues(): void {
  if (installed) return
  installed = true
  // Browsers start audio suspended until the player does something.
  window.addEventListener('pointerdown', () => void audio(), { once: true })
  const summary = () => {
    const state = useGameStore.getState().state
    return {
      unread: state?.inbox.messages.filter((message) => !message.read).length ?? 0,
      reasons: state?.pauseReasons ?? [],
      finished: state?.finished ?? false,
    }
  }
  let previous = summary()
  let gameId = useGameStore.getState().state?.gameId
  useGameStore.subscribe((store) => {
    const next = summary()
    // Opening a campaign is not news.
    const same = store.state?.gameId === gameId
    gameId = store.state?.gameId
    const cue = same ? cueFor(previous, next) : undefined
    previous = next
    if (cue) play(cue)
  })
}
