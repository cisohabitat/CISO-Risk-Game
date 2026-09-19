/**
 * Save schema versioning and migration (plan §53: "save schema versioning
 * exists", "IndexedDB migration tests pass").
 */
import { describe, expect, it } from 'vitest'
import { migrateSave, SaveMigrationError } from '@/store/migrations'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { checkInvariants } from '@/game/engine/invariants'
import { SAVE_SCHEMA_VERSION } from '@/game/types'
import { testIndex } from './helpers'

function record(state: unknown, schemaVersion: number) {
  return {
    slot: 'manual' as const,
    schemaVersion,
    savedAtIso: '2026-01-01T00:00:00.000Z',
    campaignTitle: 'CISO: First Year',
    state,
  }
}

describe('save migration', () => {
  it('accepts a current save unchanged', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'save-1' })
    runDays(state, index, 40)
    const migrated = migrateSave(record(JSON.parse(JSON.stringify(state)), SAVE_SCHEMA_VERSION))
    expect(migrated.state.currentDay).toBe(state.currentDay)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(checkInvariants(migrated.state, index)).toEqual([])
  })

  it('upgrades a version 1 save by filling in what later versions added', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'save-2' })
    runDays(state, index, 30)
    const legacy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>
    delete legacy.reviews
    delete legacy.tutorial
    delete legacy.pendingEffects
    legacy.schemaVersion = 1

    const migrated = migrateSave(record(legacy, 1))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.state.reviews).toEqual({ quarters: [] })
    expect(migrated.state.tutorial).toEqual({ seen: [], dismissed: [] })
    expect(migrated.state.pendingEffects).toEqual([])
    // A migrated save must still be playable.
    runDays(migrated.state, index, 20)
    expect(checkInvariants(migrated.state, index)).toEqual([])
  })

  it('upgrades a version 2 save', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'save-3' })
    runDays(state, index, 20)
    const legacy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>
    delete legacy.pendingEffects
    legacy.schemaVersion = 2
    const migrated = migrateSave(record(legacy, 2))
    expect(migrated.state.pendingEffects).toEqual([])
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
  })

  it('refuses a save from a newer version of the game rather than corrupting it', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'save-4' })
    expect(() => migrateSave(record(JSON.parse(JSON.stringify(state)), SAVE_SCHEMA_VERSION + 1))).toThrow(
      SaveMigrationError,
    )
  })

  it('refuses a file that is not a save at all', () => {
    expect(() => migrateSave({ hello: 'world' })).toThrow(SaveMigrationError)
    expect(() => migrateSave(null)).toThrow(SaveMigrationError)
  })

  it('round-trips a campaign through export and import', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'save-5' })
    runDays(state, index, 120)
    const json = JSON.stringify(record(JSON.parse(JSON.stringify(state)), SAVE_SCHEMA_VERSION))
    const restored = migrateSave(JSON.parse(json))
    runDays(restored.state, index, 60)
    runDays(state, index, 60)
    // Determinism survives the round trip. Compare by value: passing through
    // the save schema can reorder object keys without changing meaning.
    expect(restored.state).toEqual(JSON.parse(JSON.stringify(state)))
  })
})
