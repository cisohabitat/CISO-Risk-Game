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
  // Isolated from the mid-year incident floor (25 November, design F).
  state.flags['incident.floor'] = true
  state.decisions.openIds = []
  state.incidents = { incidents: {}, order: [], counter: 0 }
  state.pendingEffects = []
  for (const objective of Object.values(state.business.objectives)) objective.status = 'achieved'
  return { state, index }
}

describe('Skip ahead public updates', () => {
  // Since 17 November Skip ahead runs to what needs the player (a decision,
  // a board paper, an incident, a blocked programme); mail waits in the inbox.
  it('runs past a returned result, which waits in the inbox', () => {
    const { state, index } = quiet()
    state.pendingEffects.push({ id: 'skip-result', day: 243, source: 'decision:dec-pentest-scope', note: 'The report is in.', effects: [] })
    const result = applyAction(state, index, { type: 'advance', days: 30, stopOnUpdate: true })
    expect(result.ok).toBe(true)
    // Three weeks at most since 28 November (427b290 playtest, MJ-02).
    expect(state.currentDay).toBe(261)
    expect(result.message).toContain('three weeks have passed')
    expect(state.inbox.messages.some((message) => message.subject === 'Followed up: Penetration test scope')).toBe(true)
  })

  // A missed objective passed inside long jumps in silence; since 28 November
  // it stops Skip ahead (427b290 playtest, MJ-02).
  it('stops on a missed business commitment, and names it', () => {
    const { state, index } = quiet()
    const objective = state.business.objectives['obj-platform-launch']!
    objective.status = 'active'; objective.progress = 0.5
    state.currentDay = objective.targetDay
    const result = applyAction(state, index, { type: 'advance', days: 30, stopOnUpdate: true })
    expect(state.currentDay).toBe(objective.targetDay + 1)
    expect(result.message).toContain('missed its date')
    expect(state.inbox.messages.some((message) => message.subject.startsWith('Missed:'))).toBe(true)
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
