import { describe, expect, it } from 'vitest'
import { savedAtLabel } from '@/lib/formatting/saved-at'

/** Phase 4 of docs/ROADMAP.md: the interface speaks one language, not the browser's. */
describe('dates in the interface language', () => {
  it('writes a save time the British way whatever the browser is set to', () => {
    const label = savedAtLabel('2026-10-09T15:04:12.000Z')
    expect(label).toMatch(/^9 Oct 2026, \d{2}:\d{2}$/)
    expect(label).not.toMatch(/PM|AM|10\/9/)
  })
})
