/**
 * Drives simulated time from the UI.
 *
 * The engine only ever moves when a tick is requested: there is no 60fps loop
 * and nothing is computed while the game is paused (plan §48).
 */
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/game-store'

const MS_PER_DAY: Record<string, number> = {
  '1x': 900,
  '2x': 450,
  '4x': 200,
}

export function useGameClock(): void {
  const speed = useGameStore((store) => store.state?.speed ?? 'paused')
  const paused = useGameStore((store) => store.state?.paused ?? true)
  const finished = useGameStore((store) => store.state?.finished ?? false)
  const advanceDays = useGameStore((store) => store.advanceDays)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (paused || speed === 'paused' || finished) return
    const interval = MS_PER_DAY[speed] ?? 900
    timer.current = window.setInterval(() => {
      advanceDays(1)
    }, interval)
    return () => {
      if (timer.current !== undefined) window.clearInterval(timer.current)
      timer.current = undefined
    }
  }, [speed, paused, finished, advanceDays])
}
