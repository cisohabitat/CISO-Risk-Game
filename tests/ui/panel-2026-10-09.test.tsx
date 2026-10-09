// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { useKeyboardShortcuts } from '@/app/useKeyboardShortcuts'
import { teamView } from '@/store/selectors'

/**
 * What the AI playtest panel of 9 October 2026 found in the interface
 * (docs/playtests/2026-10-09-ai-panel-*.md), held.
 */
function Shortcuts({ children }: { children?: React.ReactNode }) {
  useKeyboardShortcuts()
  return <>{children}</>
}

describe('the keyboard shortcuts belong to the page, not to what has focus', () => {
  it('Space on a button inside a dialog does not start the clock', async () => {
    await useGameStore.getState().startNewGame('ui-panel-space', 'ciso')
    render(
      <Shortcuts>
        <div role="dialog" aria-modal="true">
          <button type="button">More evidence is required</button>
        </div>
      </Shortcuts>,
    )
    const before = useGameStore.getState().state!.speed
    const button = screen.getByRole('button', { name: 'More evidence is required' })
    button.focus()
    fireEvent.keyDown(button, { key: ' ' })
    expect(useGameStore.getState().state!.speed).toBe(before)
    // A letter inside a dialog does not change the screen behind it.
    fireEvent.keyDown(button, { key: 'b' })
    expect(useGameStore.getState().ui.screen).not.toBe('board')
  })

  it('→ on a tab moves between tabs and does not skip ahead', async () => {
    await useGameStore.getState().startNewGame('ui-panel-arrow', 'ciso')
    render(
      <Shortcuts>
        <div role="tablist" aria-label="Risk workspace">
          <button type="button" role="tab">Evidence</button>
        </div>
      </Shortcuts>,
    )
    const day = useGameStore.getState().state!.currentDay
    const tab = screen.getByRole('tab', { name: 'Evidence' })
    tab.focus()
    fireEvent.keyDown(tab, { key: 'ArrowRight' })
    expect(useGameStore.getState().state!.currentDay).toBe(day)
  })

  it('still works from the page itself', async () => {
    await useGameStore.getState().startNewGame('ui-panel-page', 'ciso')
    render(<Shortcuts />)
    fireEvent.keyDown(document.body, { key: 'b' })
    expect(useGameStore.getState().ui.screen).toBe('board')
  })
})

describe('a hire already paid for', () => {
  it('reads as recruiting, so the Team screen does not offer it again', async () => {
    await useGameStore.getState().startNewGame('ui-panel-hire', 'ciso')
    const { index } = useGameStore.getState()
    useGameStore.setState((store) => {
      const next = structuredClone(store.state!)
      next.pendingEffects.push({ id: 'hire', day: next.currentDay + 60, source: 'decision', effects: [{ type: 'team.vacancyFilled', fn: 'iam' }] })
      return { state: next }
    })
    const iam = teamView(useGameStore.getState().state!, index!).functions.find((fn) => fn.fn === 'iam')!
    expect(iam.vacancies).toBeGreaterThan(0)
    expect(iam.hiring).toBe(true)
  })
})
