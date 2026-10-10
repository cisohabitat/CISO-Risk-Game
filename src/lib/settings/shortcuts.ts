/**
 * Whether single-key shortcuts act (WCAG 2.1.4). On unless the player turns
 * them off: they already do nothing from inside a dialog or a focused control,
 * but a screen-reader user in browse mode can still meet them, and the
 * accessibility statement owed a way to turn them off.
 */
import { useSyncExternalStore } from 'react'

const KEY = 'ciso-shortcuts'
const listeners = new Set<() => void>()
/** Where storage is blocked, the choice is kept here for the tab. */
let fallback: boolean | undefined

function stored(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setShortcuts(on: boolean): void {
  try {
    if (on) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, 'off')
  } catch {
    /* Blocked storage: the choice lasts for this tab only. */
    fallback = on
  }
  listeners.forEach((listener) => listener())
}

function current(): boolean {
  return fallback ?? stored()
}

export function shortcutsEnabled(): boolean {
  return current()
}

export function useShortcuts(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    current,
    () => true,
  )
}
