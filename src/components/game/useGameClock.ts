/**
 * Drives simulated time from the UI.
 *
 * The engine only ever moves when a tick is requested: there is no 60fps loop
 * and nothing is computed while the game is paused (plan §48).
 */
import { CAMPAIGN_DAYS } from '@/game/types'
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/game-store'

const MS_PER_DAY: Record<string, number> = {
  '1x': 900,
  '2x': 450,
  '4x': 200,
}

export function useGameClock(): void {
  const gameId = useGameStore((store) => store.state?.gameId)
  const speed = useGameStore((store) => store.state?.speed ?? 'paused')
  const paused = useGameStore((store) => store.state?.paused ?? true)
  const finished = useGameStore((store) => store.state?.finished ?? false)
  const advanceDays = useGameStore((store) => store.advanceDays)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (paused || speed === 'paused' || finished) return
    const interval = MS_PER_DAY[speed] ?? 900
    timer.current = window.setInterval(() => {
      // A browser callback may already be queued when React clears this timer.
      // Never let it overrun an engine pause or a newly opened reading surface.
      const store = useGameStore.getState()
      const current = store.state
      if (!current || current.gameId !== gameId || current.paused || current.finished || current.currentDay >= CAMPAIGN_DAYS || current.speed !== speed) return
      if (document.hidden || store.ui.openDecisionId || store.ui.glossaryOpen || document.querySelector('[role="dialog"][aria-modal="true"]')) {
        store.dispatch({ type: 'setSpeed', speed: 'paused' })
        return
      }
      advanceDays(1)
    }, interval)
    const holdForReader = () => {
      const store = useGameStore.getState()
      const current = store.state
      if (current && current.gameId === gameId && !current.paused && (store.ui.openDecisionId || store.ui.glossaryOpen || document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]'))) store.dispatch({ type: 'setSpeed', speed: 'paused' })
    }
    const readerObserver = new MutationObserver(holdForReader)
    readerObserver.observe(document.body, { childList: true, subtree: true })
    holdForReader()
    const holdWhenHidden = () => {
      if (document.hidden && useGameStore.getState().state?.gameId === gameId) useGameStore.getState().dispatch({ type: 'setSpeed', speed: 'paused' })
    }
    document.addEventListener('visibilitychange', holdWhenHidden)
    return () => {
      readerObserver.disconnect()
      document.removeEventListener('visibilitychange', holdWhenHidden)
      if (timer.current !== undefined) window.clearInterval(timer.current)
      timer.current = undefined
    }
  }, [gameId, speed, paused, finished, advanceDays])
}
