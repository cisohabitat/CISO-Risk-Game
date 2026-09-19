/**
 * Local-first persistence (plan §32.8).
 *
 * Saves live in IndexedDB on the player's device. There is no account, no
 * server and no network call in the save path, which is what makes the MVP
 * deployable on static hosting with no runtime cost.
 */
import { openDB, type IDBPDatabase } from 'idb'
import type { GameState } from '@/game/types'
import { SAVE_SCHEMA_VERSION } from '@/game/types'
import { migrateSave, type StoredSave } from './migrations'

const DB_NAME = 'ciso-first-year'
const DB_VERSION = 1
const STORE = 'saves'
const AUTOSAVE_SLOTS = 3

export type SaveSlot = 'auto-0' | 'auto-1' | 'auto-2' | 'manual' | 'import'

export interface SaveSummary {
  slot: SaveSlot
  gameId: string
  seed: string
  day: number
  difficulty: string
  savedAtIso: string
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
  })
  return dbPromise
}

/** IndexedDB is unavailable in some privacy modes; the game must still play. */
export function storageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

function toRecord(slot: SaveSlot, state: GameState, campaignTitle: string): StoredSave {
  return {
    slot,
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAtIso: new Date().toISOString(),
    campaignTitle,
    state: JSON.parse(JSON.stringify(state)) as GameState,
  }
}

export async function writeSave(slot: SaveSlot, state: GameState, campaignTitle: string): Promise<void> {
  if (!storageAvailable()) return
  const db = await getDb()
  await db.put(STORE, toRecord(slot, state, campaignTitle))
}

/** Rolling autosaves: the newest goes to auto-0 and the others shift down. */
export async function writeAutosave(state: GameState, campaignTitle: string): Promise<void> {
  if (!storageAvailable()) return
  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  for (let i = AUTOSAVE_SLOTS - 1; i > 0; i -= 1) {
    const previous = (await store.get(`auto-${i - 1}`)) as StoredSave | undefined
    if (previous) await store.put({ ...previous, slot: `auto-${i}` as SaveSlot })
  }
  await store.put(toRecord('auto-0', state, campaignTitle))
  await tx.done
}

export async function readSave(slot: SaveSlot): Promise<GameState | undefined> {
  if (!storageAvailable()) return undefined
  const db = await getDb()
  const record = (await db.get(STORE, slot)) as StoredSave | undefined
  if (!record) return undefined
  return migrateSave(record).state
}

export async function listSaves(): Promise<SaveSummary[]> {
  if (!storageAvailable()) return []
  const db = await getDb()
  const records = (await db.getAll(STORE)) as StoredSave[]
  return records
    .map((record) => {
      const migrated = migrateSave(record)
      return {
        slot: migrated.slot,
        gameId: migrated.state.gameId,
        seed: migrated.state.seed,
        day: migrated.state.currentDay,
        difficulty: migrated.state.difficulty,
        savedAtIso: migrated.savedAtIso,
        schemaVersion: migrated.schemaVersion,
        campaignTitle: migrated.campaignTitle,
      }
    })
    .sort((a, b) => b.savedAtIso.localeCompare(a.savedAtIso))
}

export async function deleteSave(slot: SaveSlot): Promise<void> {
  if (!storageAvailable()) return
  const db = await getDb()
  await db.delete(STORE, slot)
}

export async function clearSaves(): Promise<void> {
  if (!storageAvailable()) return
  const db = await getDb()
  await db.clear(STORE)
}

/** Export a save as JSON so a campaign survives a cleared browser profile. */
export function exportSave(state: GameState, campaignTitle: string): string {
  return JSON.stringify(toRecord('manual', state, campaignTitle), null, 2)
}

export function parseImportedSave(json: string): StoredSave {
  const parsed: unknown = JSON.parse(json)
  return migrateSave(parsed)
}
