/**
 * Keyboard shortcuts are an accelerator, never a requirement (plan §27.3).
 * They are ignored while the player is typing.
 */
import { useEffect } from 'react'
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

export function useKeyboardShortcuts(): void {
  const setScreen = useGameStore((store) => store.setScreen)
  const openGlossary = useGameStore((store) => store.openGlossary)
  const dispatch = useGameStore((store) => store.dispatch)
  const advanceDays = useGameStore((store) => store.advanceDays)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
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
