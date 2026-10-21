import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { checkInvariants } from '@/game/engine/invariants'
import { createNextYear } from '@/game/engine/next-year'
import { finishYear } from '@/game/debrief/review'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
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

  it.each(['emergency', 'window', 'mitigate'])('returns only the capacity actually diverted by %s', (key) => {
    const { state, decision } = scenario()
    const fn = key === 'window' ? 'soc' : 'engineering'
    state.team.functions[fn]!.capacity = 0.2
    expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: `opt-exploit-${key}`, rationaleTagIds: ['rat-material'] }).ok).toBe(true)
    expect(state.team.functions[fn]!.capacity).toBe(0)
    // A later staffing change must survive the expiry; restoring a snapshot
    // would erase it, while returning the requested 0.5 would invent capacity.
    applyEffects(state, [{ type: 'capacity.change', fn, delta: 1 }], { index, rng: createRng('hire'), source: 'review-hire' })
    const reloaded = JSON.parse(JSON.stringify(state)) as typeof state
    runDays(reloaded, index, key === 'emergency' ? 2 : 11)
    expect(reloaded.team.functions[fn]!.capacity).toBeCloseTo(1.2)
    expect(checkInvariants(reloaded, index)).toEqual([])
  })

  it.each(['mitigate', 'isolate'])('retires the actual %s reduction at both exposure bounds', (key) => {
    for (const exposure of [0, 0.05, 0.5, 1]) {
      const { state, decision } = scenario()
      state.organisation.nodes['node-app-checkout']!.exposure = exposure
      applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: `opt-exploit-${key}`, rationaleTagIds: ['rat-material'] })
      runDays(state, index, 11)
      expect(state.organisation.nodes['node-app-checkout']!.exposure).toBeCloseTo(exposure)
    }
  })

  it('keeps independent exposure changes when a restriction expires', () => {
    const { state, decision } = scenario()
    state.organisation.nodes['node-app-checkout']!.exposure = 0.5
    applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-exploit-isolate', rationaleTagIds: ['rat-material'] })
    applyEffects(state, [{ type: 'node.exposure', nodeId: 'node-app-checkout', delta: 0.1 }], { index, rng: createRng('other-change'), source: 'other-change' })
    runDays(state, index, 11)
    expect(state.organisation.nodes['node-app-checkout']!.exposure).toBeCloseTo(0.6)
  })

  it('expires overlapping temporary changes independently without repeating an inverse', () => {
    const state = choose('emergency')
    state.organisation.nodes['node-app-checkout']!.exposure = 0.5
    applyEffects(state, [
      { type: 'node.exposure', nodeId: 'node-app-checkout', delta: -0.2, temporary: { dayOffset: 2 } },
      { type: 'node.exposure', nodeId: 'node-app-checkout', delta: -0.1, temporary: { dayOffset: 4 } },
    ], { index, rng: createRng('overlap'), source: 'overlap' })
    expect(new Set(state.pendingEffects.map((entry) => entry.id)).size).toBe(state.pendingEffects.length)
    runDays(state, index, 2)
    expect(state.organisation.nodes['node-app-checkout']!.exposure).toBeCloseTo(0.4)
    runDays(state, index, 2)
    expect(state.organisation.nodes['node-app-checkout']!.exposure).toBeCloseTo(0.5)
    runDays(state, index, 2)
    expect(state.organisation.nodes['node-app-checkout']!.exposure).toBeCloseTo(0.5)
  })

  it('measures the emergency engineering diversion from authorisation, not the advisory', () => {
    const { state, decision } = scenario()
    const capacity = state.team.functions.engineering!.capacity
    runDays(state, index, 1)
    applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-exploit-emergency', rationaleTagIds: ['rat-material'] })
    runDays(state, index, 1)
    expect(state.team.functions.engineering!.capacity).toBe(capacity - 0.5)
    runDays(state, index, 1)
    expect(state.team.functions.engineering!.capacity).toBe(capacity)
  })

  it.each(['window', 'mitigate', 'isolate'])('anchors the %s patch and temporary effects to the announced window', (key) => {
    const { state, decision } = scenario()
    runDays(state, index, 1)
    applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: `opt-exploit-${key}`, rationaleTagIds: ['rat-material'] })
    expect(state.pendingEffects.filter((entry) => entry.source === 'decision:dec-exploit-published').map((entry) => entry.day)).toEqual(expect.arrayContaining([61]))
    expect(state.pendingEffects.filter((entry) => entry.source === 'decision:dec-exploit-published').every((entry) => entry.day === 61)).toBe(true)
    const before = state.organisation.nodes['node-app-checkout']!.weakness
    runDays(state, index, 9)
    expect(state.organisation.nodes['node-app-checkout']!.weakness).toBe(before)
    runDays(state, index, 1)
    expect(state.organisation.nodes['node-app-checkout']!.weakness).toBeLessThan(before)
  })

  it('anchors an automatic default to the original window and preserves bounded refunds', () => {
    const { state, decision } = scenario()
    state.team.functions.soc!.capacity = 0.2
    runDays(state, index, 3)
    expect(decision.resolvedByDefault).toBe(true)
    expect(state.pendingEffects.some((entry) => entry.day === 61)).toBe(true)
    expect(state.team.functions.soc!.capacity).toBe(0)
    runDays(state, index, 8)
    expect(state.team.functions.soc!.capacity).toBeCloseTo(0.2)
    expect(state.pendingEffects.filter((entry) => entry.source.includes('dec-exploit-published'))).toEqual([])
  })

  it('bounds the watch exposure increase and keeps its expiry date across a year', () => {
    const { state, decision } = scenario(CAMPAIGN_DAYS)
    state.organisation.nodes['node-app-checkout']!.exposure = 0.98
    applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-exploit-window', rationaleTagIds: ['rat-material'] })
    expect(state.organisation.nodes['node-app-checkout']!.exposure).toBe(1)
    finishYear(state, index)
    const next = createNextYear(index, JSON.parse(JSON.stringify(state)))
    runDays(next, index, 11)
    expect(next.organisation.nodes['node-app-checkout']!.exposure).toBeCloseTo(0.98)
  })
})
