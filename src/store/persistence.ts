/**
 * Local-first persistence (plan §32.8).
 *
 * Saves live in IndexedDB on the player's device. There is no account, no
 * server and no network call in the save path, which is what makes the MVP
 * deployable on static hosting with no runtime cost.
 *
 * **One save per campaign.** The key is the campaign, so every write replaces
 * that campaign's save rather than adding a row to the list. Rolling autosave
 * slots came before: a single campaign then occupied three rows of the start
 * screen, one per recent day, and a second campaign's saves interleaved with
 * the first's until they aged out. Nothing in the interface said those rows
 * were the same year, so they read as several games.
 */
import { openDB, type IDBPDatabase } from 'idb'
import type { GameState } from '@/game/types'
import { SAVE_SCHEMA_VERSION } from '@/game/types'
import { migrateSave, type StoredSave } from './migrations'

const DB_NAME = 'ciso-first-year'
const DB_VERSION = 1
const STORE = 'saves'

/**
 * The object store's key. The stored property is called `slot` for the era of
 * rolling slots; renaming it would mean rebuilding the store for nothing.
 */
export type SaveKey = string

export function campaignKey(gameId: string): SaveKey {
  return `campaign:${gameId}`
}

function isCampaignKey(key: unknown): boolean {
  return typeof key === 'string' && key.startsWith('campaign:')
}

export interface SaveSummary {
  key: SaveKey
  gameId: string
  seed: string
  day: number
  difficulty: string
  savedAtIso: string
  savedByPlayer: boolean
  schemaVersion: number
  campaignTitle: string
}

let dbPromise: Promise<IDBPDatabase> | undefined

function getDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'slot' })
      }
    },
  }).then(async (db) => {
    // A player who already has rolling-slot saves keeps the newest of each
    // campaign and loses the duplicates. Failing this must not stop the game
    // opening, so it is deliberately swallowed: the list still reads.
    try {
      await collapseLegacySaves(db)
    } catch {
      /* the saves are still readable; they are just still duplicated. */
    }
    return db
  })
  return dbPromise
}

/** Fold pre-campaign-key records into one save per campaign. Idempotent. */
async function collapseLegacySaves(db: IDBPDatabase): Promise<void> {
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const records = (await store.getAll()) as StoredSave[]
  const legacy = records.filter((record) => !isCampaignKey(record.slot) && record.state?.gameId)
  if (legacy.length === 0) {
    await tx.done
    return
  }
  const newest = new Map<string, StoredSave>()
  for (const record of legacy) {
    const held = newest.get(record.state.gameId)
    if (!held || record.savedAtIso > held.savedAtIso) newest.set(record.state.gameId, record)
  }
  for (const record of legacy) await store.delete(record.slot)
  for (const [gameId, record] of newest) {
    const key = campaignKey(gameId)
    const existing = records.find((other) => other.slot === key)
    if (existing && existing.savedAtIso >= record.savedAtIso) continue
    await store.put({ ...record, slot: key })
  }
  await tx.done
}

/** IndexedDB is unavailable in some privacy modes; the game must still play. */
export function storageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

function toRecord(state: GameState, campaignTitle: string, savedByPlayer: boolean): StoredSave {
  return {
    slot: campaignKey(state.gameId),
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAtIso: new Date().toISOString(),
    savedByPlayer,
    campaignTitle,
    state: JSON.parse(JSON.stringify(state)) as GameState,
  }
}

/**
 * Write the campaign's save. `savedByPlayer` records that this point was one
 * the player asked to keep rather than one the game took on its own; the next
 * autosave of the same campaign clears it, because it is a fact about the
 * save that exists now, not a label the campaign carries.
 */
export async function writeCampaign(
  state: GameState,
  campaignTitle: string,
  { savedByPlayer = false }: { savedByPlayer?: boolean } = {},
): Promise<void> {
  if (!storageAvailable()) return
  const db = await getDb()
  await db.put(STORE, toRecord(state, campaignTitle, savedByPlayer))
}

export async function readSave(key: SaveKey): Promise<GameState | undefined> {
  if (!storageAvailable()) return undefined
  const db = await getDb()
  const record = (await db.get(STORE, key)) as StoredSave | undefined
  if (!record) return undefined
  return migrateSave(record).state
}

export async function listSaves(): Promise<SaveSummary[]> {
  if (!storageAvailable()) return []
  const db = await getDb()
  const records = (await db.getAll(STORE)) as StoredSave[]
  // Grouped by campaign rather than trusting the key, so a save left behind by
  // an interrupted collapse does not put the same campaign on the list twice.
  const newest = new Map<string, SaveSummary>()
  for (const record of records) {
    let summary: SaveSummary
    try {
      const migrated = migrateSave(record)
      summary = {
        key: record.slot,
        gameId: migrated.state.gameId,
        seed: migrated.state.seed,
        day: migrated.state.currentDay,
        difficulty: migrated.state.difficulty,
        savedAtIso: migrated.savedAtIso,
        savedByPlayer: migrated.savedByPlayer,
        schemaVersion: migrated.schemaVersion,
        campaignTitle: migrated.campaignTitle,
      }
    } catch {
      continue // Unreadable: it cannot be resumed, so it is not offered.
    }
    const held = newest.get(summary.gameId)
    if (!held || summary.savedAtIso > held.savedAtIso) newest.set(summary.gameId, summary)
  }
  return [...newest.values()].sort((a, b) => b.savedAtIso.localeCompare(a.savedAtIso))
}

/**
 * Delete a campaign. One record is the campaign now, but a save left by an
 * older build is removed with it: the player asked for the game to go.
 * Returns how many records went.
 */
export async function deleteCampaign(gameId: string): Promise<number> {
  if (!storageAvailable()) return 0
  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const records = (await store.getAll()) as StoredSave[]
  let removed = 0
  for (const record of records) {
    if (record.state?.gameId !== gameId) continue
    await store.delete(record.slot)
    removed += 1
  }
  await tx.done
  return removed
}

export async function clearSaves(): Promise<void> {
  if (!storageAvailable()) return
  const db = await getDb()
  await db.clear(STORE)
}

/** Export a save as JSON so a campaign survives a cleared browser profile. */
export function exportSave(state: GameState, campaignTitle: string): string {
  return JSON.stringify(toRecord(state, campaignTitle, true), null, 2)
}

export function parseImportedSave(json: string): StoredSave {
  const parsed: unknown = JSON.parse(json)
  return migrateSave(parsed)
}
