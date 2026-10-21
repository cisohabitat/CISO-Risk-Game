import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { checkInvariants } from '@/game/engine/invariants'
import { createNextYear } from '@/game/engine/next-year'
import { finishYear } from '@/game/debrief/review'
import { CAMPAIGN_DAYS } from '@/game/types'
import { testIndex } from './helpers'

const index = testIndex()
const callbacks = (state: ReturnType<typeof newGame>) => state.inbox.messages.filter((message) => message.eventId?.startsWith('evt-con-exploit-'))

function scenario(day = 50) {
  const state = newGame(index, { seed: 'ai-accelerated', difficulty: 'ciso' })
  state.currentDay = day
  // Isolate authored responses from unrelated pool events, while retaining the
  // daily engine, drift, capacity accounting and scheduled-effect ordering.
  state.events.suppressedEventIds = index.content.events.filter((event) => !event.id.startsWith('evt-con-exploit-')).map((event) => event.id)
  const decision = openDecision(state, index, 'dec-exploit-published')!
  return { state, decision }
}

function choose(key: string, day = 50) {
  const { state, decision } = scenario(day)
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: `opt-exploit-${key}`, rationaleTagIds: ['rat-material'] }).ok).toBe(true)
  return state
}

describe('an exploit accelerated by AI', () => {
  it('shortens the response window without forcing an incident', () => {
    const { state, decision } = scenario()
    expect(decision.deadlineDay! - state.currentDay).toBe(2)
    const def = index.decision.get(decision.defId)!
    expect(def.options.map((option) => option.id)).toEqual(expect.arrayContaining(['opt-exploit-emergency', 'opt-exploit-window', 'opt-exploit-mitigate', 'opt-exploit-isolate']))
    expect(def.options.flatMap((option) => option.immediateEffects).some((effect) => effect.type === 'incident.start')).toBe(false)
  })

  it.each(['emergency', 'mitigate', 'isolate'])('answers the %s choice once and preserves invariants', (key) => {
    const state = choose(key)
    runDays(state, index, 2)
    expect(callbacks(state).map((message) => message.eventId)).toEqual([`evt-con-exploit-${key}`])
    runDays(state, index, 12)
    expect(callbacks(state)).toHaveLength(1)
    expect(checkInvariants(state, index)).toEqual([])
  })

  it('trades immediate reduction for delivery capacity or launch delay', () => {
    const baseline = scenario().state
    const emergency = choose('emergency')
    expect(emergency.organisation.nodes['node-app-checkout']!.weakness).toBeLessThan(baseline.organisation.nodes['node-app-checkout']!.weakness)
    expect(emergency.team.functions.engineering!.capacity).toBe(baseline.team.functions.engineering!.capacity - 0.5)
    runDays(emergency, index, 2)
    expect(emergency.team.functions.engineering!.capacity).toBe(baseline.team.functions.engineering!.capacity)
    const restricted = choose('isolate')
    expect(restricted.organisation.nodes['node-app-checkout']!.exposure).toBeLessThan(baseline.organisation.nodes['node-app-checkout']!.exposure)
    expect(restricted.business.objectives['obj-platform-launch']!.delayDays).toBe(baseline.business.objectives['obj-platform-launch']!.delayDays + 7)
  })

  it.each([0.2, 0.9])('checks live logging coverage (%s) when the watch report returns', (coverage) => {
    const state = choose('window')
    const before = scenario().state
    expect(state.organisation.nodes['node-app-checkout']!.weakness).toBe(before.organisation.nodes['node-app-checkout']!.weakness)
    expect(state.team.functions.soc!.capacity).toBe(before.team.functions.soc!.capacity - 0.5)
    state.controls.controls['ctl-logging']!.coverage = coverage
    runDays(state, index, 2)
    expect(callbacks(state).map((message) => message.eventId)).toEqual([coverage < 0.6 ? 'evt-con-exploit-window-limited' : 'evt-con-exploit-window'])
    runDays(state, index, 9)
    expect(state.team.functions.soc!.capacity).toBe(before.team.functions.soc!.capacity)
    expect(state.organisation.nodes['node-app-checkout']!.weakness).toBeLessThan(before.organisation.nodes['node-app-checkout']!.weakness)
    expect(checkInvariants(state, index)).toEqual([])
  })

  it('keeps a late commitment and its capacity release through save reload and year transition', () => {
    const state = choose('window', CAMPAIGN_DAYS)
    finishYear(state, index)
    const next = createNextYear(index, JSON.parse(JSON.stringify(state)))
    next.controls.controls['ctl-logging']!.coverage = 0.2
    runDays(next, index, 11)
    expect(callbacks(next).map((message) => message.eventId)).toEqual(['evt-con-exploit-window-limited'])
    expect(next.flags['exploit.window']).toBeUndefined()
    expect(next.pendingEffects.some((entry) => entry.source === 'decision:dec-exploit-published')).toBe(false)
    expect(checkInvariants(next, index)).toEqual([])
  })
})
