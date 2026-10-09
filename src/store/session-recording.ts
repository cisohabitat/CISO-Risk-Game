/**
 * Whether this browser is recording a playtest session (docs/ROADMAP.md,
 * Phase 0). Only the switch lives on the first screen's path; the recorder
 * itself is loaded when recording is on, so a player who never records never
 * downloads it.
 *
 * Nothing leaves the device. The log is kept in this browser's storage and
 * handed over only when the player exports it.
 */
import { useSyncExternalStore } from 'react'

const FLAG = 'ciso-session-recording'
const listeners = new Set<() => void>()

export function isRecording(): boolean {
  try {
    return localStorage.getItem(FLAG) === 'on'
  } catch {
    return false
  }
}

/** A facilitator's link (`/?playtest`) turns recording on for this browser. */
export function playtestRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('playtest')
  } catch {
    return false
  }
}

export function setRecording(on: boolean): void {
  if (on === isRecording()) {
    if (on) void startRecorder()
    return
  }
  try {
    if (on) localStorage.setItem(FLAG, 'on')
    else localStorage.removeItem(FLAG)
  } catch {
    /* Blocked storage: the session simply is not recorded. */
  }
  // Switched on from off: a new session, so a new log. Resuming after a
  // reload goes through startRecorder and keeps the one already running.
  if (on) void startRecorder().then(() => import('./session-log').then((log) => log.beginFresh()))
  listeners.forEach((listener) => listener())
}

/** Whether recording is on, for the screens that show it. */
export function useRecording(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    isRecording,
    () => false,
  )
}

/** Turns recording on from a facilitator's link, or resumes it after a reload. */
export function resumeRecording(): void {
  if (playtestRequested()) setRecording(true)
  else if (isRecording()) void startRecorder()
}

let started: Promise<void> | undefined

export function startRecorder(): Promise<void> {
  return (started ??= import('./session-log').then((log) => log.installSessionLog()))
}
