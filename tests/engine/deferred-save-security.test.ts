import { describe, expect, it } from 'vitest'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { exportSave } from '@/store/persistence'
import { parseImportedSave } from '@/store/import-save'
import { migrateSave } from '@/store/migrations'
import { saveSafety } from '@/store/save-safety'
import { testIndex } from './helpers'

const index = testIndex()
describe('deferred save security', () => {
  it.each(['__proto__', 'constructor', 'prototype'])('rejects a %s target before file or stored-save migration', (controlId) => {
    const state = newGame(index, { seed: 'untrusted-effect' })
    state.pendingEffects.push({ id: 'bad', day: 1, source: 'test', effects: [{ type: 'control.coverage', controlId, delta: 0.2 }] })
    const json = exportSave(state, 'Test')
    expect(() => parseImportedSave(json)).toThrow('unsafe reference')
    expect(() => migrateSave(JSON.parse(json))).toThrow('unsafe reference')
  })

  it.each(['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'])('does not mutate inherited target %s even without the import boundary', (controlId) => {
    const state = newGame(index, { seed: 'effect-defence' })
    const target = Reflect.get(state.controls.controls, controlId) as object | undefined
    const before = target ? Object.getOwnPropertyDescriptor(target, 'coverage') : undefined
    applyEffects(state, [{ type: 'control.coverage', controlId, delta: 0.2 }], { index, rng: createRng('effect-defence', 0), source: 'test' })
    expect(target ? Object.getOwnPropertyDescriptor(target, 'coverage') : undefined).toEqual(before)
    expect(Object.hasOwn(Object.prototype, 'coverage')).toBe(false)
  })

  it('rejects malformed, missing and inherited deferred targets before execution', () => {
    for (const effect of [
      { type: 'control.coverage', controlId: 'toString', delta: 0.2 },
      { type: 'control.coverage', controlId: 'missing-control', delta: 0.2 },
      { type: 'budget.change', amount: 'untrusted text' },
      { type: 'unknown-effect' },
      { type: 'flag.set', flag: 'safe', value: { polluted: true } },
    ]) {
      const state = newGame(index, { seed: 'deferred-shape' })
      state.pendingEffects = [{ id: 'bad', day: 1, source: 'test', effects: [effect] }] as typeof state.pendingEffects
      expect(saveSafety(state, index).length).toBeGreaterThan(0)
    }
  })

  it('rejects executable lookup modes and malformed story flags', () => {
    const state = newGame(index, { seed: 'save-runtime-shape' })
    expect(saveSafety({ ...state, difficulty: 'constructor' } as unknown as typeof state, index).length).toBeGreaterThan(0)
    expect(saveSafety({ ...state, flags: { invalid: {} } } as unknown as typeof state, index).length).toBeGreaterThan(0)
  })

  it('rejects an unknown scheduled event and invalid carried flags', () => {
    const state = newGame(index, { seed: 'schedule-shape' })
    state.events.scheduled.push({ eventId: 'toString', day: 1 })
    expect(saveSafety(state, index).length).toBeGreaterThan(0)
    state.events.scheduled[0]!.eventId = 'evt-thr-hunt-clean'
    Object.assign(state.events.scheduled[0]!, { carriedFlags: { unsafe: { nested: true } } })
    expect(saveSafety(state, index).length).toBeGreaterThan(0)
  })

  it('preserves free-text notes and legitimate pending recruitment, restores and callbacks', () => {
    const state = newGame(index, { seed: 'safe-pending-roundtrip' })
    state.currentDay = 2
    state.resources.focusRemaining = 5
    expect(applyAction(state, index, { type: 'hire', fn: 'iam' }).ok).toBe(true)
    applyEffects(state, [{ type: 'capacity.change', fn: 'soc', delta: -1, temporary: { dayOffset: 8 } }, { type: 'event.schedule', eventId: 'evt-thr-hunt-clean', dayOffset: 8 }], { index, rng: createRng('safe-pending', 0), source: 'decision:dec-anomaly-response' })
    state.history.entries.push({ day: 2, kind: 'note', summary: '__proto__' })
    const restored = parseImportedSave(exportSave(state, 'Round trip')).state
    expect(saveSafety(restored, index)).toEqual([])
    runDays(restored, index, 1)
    expect(saveSafety(restored, index)).toEqual([])
  })
})
