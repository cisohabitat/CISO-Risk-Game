/**
 * Save schema versioning and migration (plan §32.8, §53).
 *
 * Every save records the schema version it was written with. Loading an older
 * save upgrades it in memory; loading a newer one is refused rather than
 * silently producing a broken campaign.
 */
import { z } from 'zod'
import type { GameState } from '@/game/types'
import { SAVE_SCHEMA_VERSION } from '@/game/types'

export interface StoredSave {
  slot: 'auto-0' | 'auto-1' | 'auto-2' | 'manual' | 'import'
  schemaVersion: number
  savedAtIso: string
  campaignTitle: string
  state: GameState
}

export class SaveMigrationError extends Error {}

/** Deliberately loose: the shape of GameState is checked by the engine's own invariants. */
const storedSaveSchema = z.object({
  slot: z.enum(['auto-0', 'auto-1', 'auto-2', 'manual', 'import']).default('import'),
  schemaVersion: z.number().int().positive(),
  savedAtIso: z.string().default(() => new Date().toISOString()),
  campaignTitle: z.string().default('CISO: First Year'),
  state: z.looseObject({
    gameId: z.string(),
    seed: z.string(),
    currentDay: z.number().int().min(0),
    contentId: z.string(),
  }),
})

type Migration = (state: Record<string, unknown>) => Record<string, unknown>

/**
 * Migrations are keyed by the version they upgrade FROM. Each one must be
 * idempotent and must not need the content bundle: a save has to load before
 * anything else can run.
 */
const MIGRATIONS: Record<number, Migration> = {
  1: (state) => ({
    ...state,
    // v2 introduced the review state and the tutorial record.
    reviews: state.reviews ?? { quarters: [] },
    tutorial: state.tutorial ?? { seen: [], dismissed: [] },
    schemaVersion: 2,
  }),
  3: (state) => {
    // v4 records whether each assumption was true when it was made. Existing
    // saves predate the distinction, so treat them as having held: that keeps
    // their behaviour exactly as the player experienced it.
    const assumptions = state.assumptions as { assumptions?: Record<string, Record<string, unknown>> } | undefined
    for (const assumption of Object.values(assumptions?.assumptions ?? {})) {
      assumption.heldWhenRecorded ??= true
    }
    return { ...state, schemaVersion: 4 }
  },
  2: (state) => ({
    ...state,
    // v3 added deferred effects and the weekly trend snapshots.
    pendingEffects: state.pendingEffects ?? [],
    history: {
      entries: [],
      decisionsLog: [],
      ...(state.history as Record<string, unknown> | undefined),
      weekly: (state.history as { weekly?: unknown[] } | undefined)?.weekly ?? [],
    },
    schemaVersion: 3,
  }),
}

export function migrateSave(raw: unknown): StoredSave {
  const parsed = storedSaveSchema.safeParse(raw)
  if (!parsed.success) {
    throw new SaveMigrationError('This file is not a CISO: First Year save.')
  }
  const record = parsed.data

  if (record.schemaVersion > SAVE_SCHEMA_VERSION) {
    throw new SaveMigrationError(
      'This save was written by a newer version of the game. Update the game, then try again.',
    )
  }

  let state = record.state as Record<string, unknown>
  let version = record.schemaVersion
  while (version < SAVE_SCHEMA_VERSION) {
    const migration = MIGRATIONS[version]
    if (!migration) {
      throw new SaveMigrationError(`No migration exists from save version ${version}.`)
    }
    state = migration(state)
    version += 1
  }
  state.schemaVersion = SAVE_SCHEMA_VERSION

  return {
    slot: record.slot,
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAtIso: record.savedAtIso,
    campaignTitle: record.campaignTitle,
    state: state as unknown as GameState,
  }
}
