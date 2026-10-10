/**
 * Keyboard shortcuts are an accelerator, never a requirement (plan §27.3).
 * They are ignored while the player is typing, and they belong to the page,
 * not to whatever has focus: an AI keyboard playtest (2026-10-09) found Space
 * on a dialog's reason button starting the clock instead of pressing it, so a
 * decision lapsed while the dialog was open; → on the Risk tabs skipping a
 * month at a time; and a letter inside the glossary changing the screen
 * behind it. None of them now fires from a dialog or from a focused control.
 */
import { useEffect } from 'react'
import { shortcutsEnabled } from '@/lib/settings/shortcuts'
import { useGameStore, type Screen } from '@/store/game-store'

const SCREEN_KEYS: Record<string, Screen> = {
  h: 'home',
  i: 'inbox',
  r: 'risk',
  o: 'organisation',
  p: 'programmes',
  t: 'team',
  b: 'board',
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

/** A control that has its own use for Space, Enter or the arrows. */
const CONTROL = 'button, a[href], summary, [role="tab"], [role="radio"], [role="checkbox"], [role="slider"], [role="switch"], [role="option"], [role="menuitem"], [role="application"], [tabindex]:not([tabindex="-1"])'

/** Whether a key press belongs to something other than the page. */
function belongsElsewhere(target: EventTarget | null, key: string): boolean {
  // A modal dialog owns the keyboard while it is open.
  if (document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) return true
  if (!(target instanceof Element)) return false
  if (target.closest('[role="dialog"]')) return true
  // Space and the arrows are how a focused control is used.
  return (key === ' ' || key.startsWith('Arrow')) && target.closest(CONTROL) !== null
}

export function useKeyboardShortcuts(): void {
  const setScreen = useGameStore((store) => store.setScreen)
  const openGlossary = useGameStore((store) => store.openGlossary)
  const dispatch = useGameStore((store) => store.dispatch)
  const advanceDays = useGameStore((store) => store.advanceDays)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!shortcutsEnabled()) return
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (belongsElsewhere(event.target, event.key)) return
      const store = useGameStore.getState()
      if (!store.state) return

      if (event.key === ' ') {
        event.preventDefault()
        const paused = store.state.paused || store.state.speed === 'paused'
        dispatch({ type: 'setSpeed', speed: paused ? '1x' : 'paused' })
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        advanceDays(30)
        return
      }
      const key = event.key.toLowerCase()
      if (key === 'g') {
        event.preventDefault()
        openGlossary()
        return
      }
      const screen = SCREEN_KEYS[key]
      if (screen) {
        event.preventDefault()
        setScreen(screen)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setScreen, openGlossary, dispatch, advanceDays])
}
