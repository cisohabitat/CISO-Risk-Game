import { describe, expect, it } from 'vitest'
import { formatSummary, summariseSession } from '../../scripts/session/summary.ts'
import type { SessionLog } from '../../src/store/session-log'

/** `pnpm session` reads a playtest log as the measures Phase 0 asks for. */
const minute = 60_000
const log: SessionLog = {
  version: 1,
  startedAt: '2026-10-09T10:00:00.000Z',
  userAgent: 'test',
  events: [
    { at: 0, day: 1, kind: 'campaign', seed: 'p-1', difficulty: 'ciso', situation: null },
    { at: 0, day: 1, kind: 'screen', screen: 'home' },
    { at: 2 * minute, day: 1, kind: 'action', type: 'resolveDecision', decisionId: 'd1', ok: true },
    { at: 3 * minute, day: 1, kind: 'screen', screen: 'risk' },
    { at: 4 * minute, day: 1, kind: 'glossary', term: 'gls-residual' },
    { at: 5 * minute, day: 1, kind: 'action', type: 'startInvestigation', investigationId: 'i1', ok: false },
    { at: 6 * minute, day: 1, kind: 'action', type: 'startInvestigation', investigationId: 'i1', ok: true },
    { at: 7 * minute, day: 1, kind: 'action', type: 'dismissTutorial', id: 'lesson-first-quarter', ok: true },
    { at: 9 * minute, day: 1, kind: 'screen', screen: 'home' },
    { at: 10 * minute, day: 1, kind: 'action', type: 'advance', days: 30, ok: true },
    { at: 10 * minute, day: 31, kind: 'paused', reasons: ['decision-deadline'] },
    { at: 12 * minute, day: 31, kind: 'paused', reasons: ['decision-deadline', 'quarter-end'] },
  ],
}

describe('reading a session log', () => {
  const summary = summariseSession(log)

  it('times the firsts by success, not by attempt', () => {
    expect(summary.firsts.decision).toEqual({ day: 1, minutes: 2 })
    // The first try at an enquiry was refused; the one that counts is the next.
    expect(summary.firsts.enquiry).toEqual({ day: 1, minutes: 6 })
    expect(summary.firsts.programme).toBeNull()
  })

  it('says how long was spent where', () => {
    expect(summary.screens).toHaveLength(2)
    expect(summary.screens).toEqual(
      expect.arrayContaining([
        { screen: 'risk', visits: 1, minutes: 6 },
        { screen: 'home', visits: 2, minutes: 6 },
      ]),
    )
    expect(summary.minutesPlayed).toBe(12)
    expect(summary.dayReached).toBe(31)
  })

  it('collects what the player reached for and where the clock stopped them', () => {
    expect(summary.glossary).toEqual(['gls-residual'])
    expect(summary.lessonsDismissed).toEqual(['lesson-first-quarter'])
    expect(summary.skips).toEqual([{ day: 1, days: 30 }])
    expect(summary.pauses).toEqual([
      { reason: 'decision-deadline', count: 2 },
      { reason: 'quarter-end', count: 1 },
    ])
  })

  it('prints a page a facilitator can paste', () => {
    const text = formatSummary(summary)
    expect(text).toContain('Campaign: seed p-1, ciso')
    expect(text).toContain('First enquiry:      day 1, 6 min in')
    expect(text).toContain('First programme:    never')
  })
})
