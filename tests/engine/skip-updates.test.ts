import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { pushMessage } from '@/game/inbox/messages'
import { messageReturnKind } from '@/game/inbox/returns'

function quiet() {
  const index = testIndex()
  const state = newGame(index, { seed: 'skip-public-updates' })
  state.currentDay = 240
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  state.decisions.openIds = []
  state.incidents = { incidents: {}, order: [], counter: 0 }
  state.pendingEffects = []
  return { state, index }
}

describe('Skip ahead public updates', () => {
  it('stops at a returned result and can continue without reading the backlog', () => {
    const { state, index } = quiet()
    state.pendingEffects.push({ id: 'skip-result', day: 243, source: 'decision:dec-pentest-scope', note: 'The report is in.', effects: [] })
    const result = applyAction(state, index, { type: 'advance', days: 30, stopOnUpdate: true })
    expect(result.ok).toBe(true)
    expect(state.currentDay).toBe(243)
    expect(result.message).toContain('Followed up: Penetration test scope')
    expect(state.paused).toBe(true)
    expect(result.ticks!.at(-1)!.shouldAutosave).toBe(true)
    applyAction(state, index, { type: 'advance', days: 1, stopOnUpdate: true })
    expect(state.currentDay).toBe(244)
  })

  it('does not change normal ticking or ordinary advance semantics', () => {
    const { state, index } = quiet()
    state.pendingEffects.push({ id: 'timed-result', day: 243, source: 'decision:dec-pentest-scope', note: 'The report is in.', effects: [] })
    const normal = structuredClone(state)
    const ticking = structuredClone(state)
    applyAction(normal, index, { type: 'advance', days: 5 })
    runDays(ticking, index, 5)
    expect(normal.currentDay).toBe(245)
    expect(normal.rngCursor).toBe(ticking.rngCursor)
    expect(normal.inbox).toEqual(ticking.inbox)
  })

  it('classifies recorded programme delivery for both Briefing and Inbox', () => {
    const { state, index } = quiet()
    for (const subject of ['Milestone: Administrative MFA', 'Delivered: Identity uplift']) {
      const message = pushMessage(state, { from: 'Programme office', subject, body: 'Recorded delivery.', type: 'programme' })
      expect(messageReturnKind(message, index)).toBe('delivery')
    }
    const routine = pushMessage(state, { from: 'Sentinel SOC', subject: 'Routine news', body: 'Routine.', type: 'threat' })
    expect(messageReturnKind(routine, index)).toBeUndefined()
  })
})
