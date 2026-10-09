// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { cueFor } from '@/lib/sound/cues'
import { soundOn } from '@/lib/sound/sound-setting'
import { SoundToggle } from '@/components/game/SoundToggle'
import { DecisionList } from '@/components/decisions/DecisionList'
import { useGameStore } from '@/store/game-store'

/** Phase 3 of docs/ROADMAP.md: motion and sound that carry news. */
const quiet = { unread: 3, reasons: [] as string[], finished: false }

describe('sound', () => {
  it('marks what just appeared, the most serious first', () => {
    expect(cueFor(quiet, quiet)).toBeUndefined()
    expect(cueFor(quiet, { ...quiet, unread: 4 })).toBe('message')
    // Reading mail is not news.
    expect(cueFor(quiet, { ...quiet, unread: 2 })).toBeUndefined()
    expect(cueFor(quiet, { ...quiet, unread: 4, reasons: ['decision-deadline'] })).toBe('decision')
    expect(cueFor(quiet, { ...quiet, reasons: ['decision-deadline', 'incident'] })).toBe('incident')
    expect(cueFor(quiet, { ...quiet, reasons: ['quarter-end'] })).toBe('quarter')
    expect(cueFor(quiet, { ...quiet, finished: true, reasons: ['year-end', 'incident'] })).toBe('year')
    // A reason that was already there does not sound again.
    const held = { ...quiet, reasons: ['incident'] }
    expect(cueFor(held, { ...held, unread: 3 })).toBeUndefined()
  })

  it('is off until the player turns it on', () => {
    localStorage.clear()
    render(<SoundToggle />)
    const toggle = screen.getByRole('button', { name: 'Sound off' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(soundOn()).toBe(false)
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Sound on' })).toHaveAttribute('aria-pressed', 'true')
    expect(soundOn()).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Sound on' }))
    expect(soundOn()).toBe(false)
  })
})

describe('motion', () => {
  it('lets a new decision arrive rather than appear', async () => {
    await useGameStore.getState().startNewGame('ui-presentation', 'ciso')
    const { container } = render(<DecisionList />)
    const items = container.querySelectorAll('li')
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) expect(item.className).toMatch(/animate-rise/)
  })
})
