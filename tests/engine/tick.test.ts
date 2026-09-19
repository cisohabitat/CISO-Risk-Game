import { describe, expect, it } from 'vitest'
import { TICK_ORDER, tickDay } from '@/game/engine/tick'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

describe('daily tick', () => {
  it('keeps the documented tick order', () => {
    // Guard against accidental reordering: subsystems read each other's output
    // within a day, so the order is part of the simulation's contract.
    expect([...TICK_ORDER]).toEqual([
      'advance-date',
      'refresh-resources',
      'apply-pending-effects',
      'business-objectives',
      'cyber-programmes',
      'delegated-work',
      'team-wellbeing',
      'stakeholders',
      'assumptions',
      'threat-pressure',
      'attack-paths',
      'incidents',
      'events',
      'inbox',
      'derived-risk',
      'auto-pause',
      'autosave',
    ])
  })

  it('advances exactly one day per tick and never goes backwards', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-1' })
    let previous = state.currentDay
    for (let i = 0; i < 90; i += 1) {
      const result = tickDay(state, index)
      expect(result.day).toBe(previous + 1)
      expect(state.currentDay).toBeGreaterThan(previous)
      previous = state.currentDay
    }
  })

  it('refreshes CISO attention weekly and does not carry it over', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-2' })
    state.resources.focusRemaining = 1
    runDays(state, index, 7)
    expect(state.resources.focusRemaining).toBe(state.resources.focusPerWeek)
  })

  it('pauses the clock at quarter end', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-3' })
    const ticks = runDays(state, index, 90)
    const last = ticks[ticks.length - 1]
    expect(last?.quarterEnded).toBe(1)
    expect(last?.pauseReasons).toContain('quarter-end')
    expect(state.reviews.pendingQuarter).toBe(1)
  })

  it('resolves an unanswered decision by its authored default', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-4' })
    runDays(state, index, 3)
    const openId = state.decisions.openIds[0]
    expect(openId).toBeDefined()
    const decision = state.decisions.decisions[openId!]!
    const def = index.decision.get(decision.defId)!
    const deadline = decision.deadlineDay
    if (deadline === undefined) return
    runDays(state, index, deadline - state.currentDay + 1)
    const resolved = state.decisions.decisions[openId!]!
    expect(resolved.resolvedDay).toBeDefined()
    expect(resolved.resolvedByDefault).toBe(true)
    expect(resolved.selectedOptionId).toBe(def.defaultOptionId)
    expect(state.decisions.openIds).not.toContain(openId)
  })

  it('delivers delayed consequences on the day they are due', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-5' })
    state.pendingEffects.push({
      id: 'test-pending',
      day: state.currentDay + 5,
      effects: [{ type: 'flag.set', flag: 'test.delayed' }],
      source: 'test',
    })
    runDays(state, index, 4)
    expect(state.flags['test.delayed']).toBeUndefined()
    runDays(state, index, 1)
    expect(state.flags['test.delayed']).toBe(true)
  })

  it('degrades unmaintained controls in the dimension that actually erodes', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-6' })
    const before = structuredClone(state.controls.controls)
    runDays(state, index, 180)

    // Coverage erosion: the estate outgrows the deployment.
    expect(state.controls.controls['ctl-mfa']!.coverage).toBeLessThan(before['ctl-mfa']!.coverage)

    // Operational decay: still deployed, no longer exercised. Coverage holds.
    const backup = state.controls.controls['ctl-backup']!
    expect(backup.operationalEffectiveness).toBeLessThan(before['ctl-backup']!.operationalEffectiveness)
    expect(backup.coverage).toBeCloseTo(before['ctl-backup']!.coverage, 5)

    // Exception accumulation: granted faster than they are retired.
    const pam = state.controls.controls['ctl-pam']!
    expect(pam.exceptionRate).toBeGreaterThan(before['ctl-pam']!.exceptionRate)
    expect(pam.coverage).toBeCloseTo(before['ctl-pam']!.coverage, 5)
  })

  it('records a weekly snapshot for trend reporting', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-7' })
    runDays(state, index, 69)
    expect(state.history.weekly.length).toBe(10)
    expect(state.history.weekly[0]?.day).toBe(7)
  })

  it('keeps the inbox bounded over a full year', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tick-8' })
    runDays(state, index, 364)
    expect(state.inbox.messages.length).toBeLessThanOrEqual(220)
  })
})
