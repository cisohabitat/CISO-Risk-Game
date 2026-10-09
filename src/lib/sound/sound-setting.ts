/**
 * Whether the game makes sound (docs/ROADMAP.md, Phase 3). Off unless the
 * player turns it on; the cues themselves load only then, so a player who
 * never wants sound never downloads it. Sound is never the only way anything
 * is said: every cue marks something already on the screen.
 */
import { useSyncExternalStore } from 'react'

const KEY = 'ciso-sound'
const listeners = new Set<() => void>()

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

let started: Promise<void> | undefined

function startCues(): Promise<void> {
  return (started ??= import('./cues').then((cues) => cues.installCues()))
}

export function setSound(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, 'on')
    else localStorage.removeItem(KEY)
  } catch {
    /* Blocked storage: the choice lasts for this tab only. */
  }
  if (on) void startCues().then(() => import('./cues').then((cues) => cues.play('confirm')))
  listeners.forEach((listener) => listener())
}

export function useSound(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    soundOn,
    () => false,
  )
}

/** After a reload, a player who chose sound keeps it. */
export function resumeSound(): void {
  if (soundOn()) void startCues()
}
