import { migrateSave, SaveMigrationError, type StoredSave } from './migrations'

export const MAX_SAVE_BYTES = 16 * 1024 * 1024
const TOO_LARGE = 'That save is too large. The import limit is 16 MiB.'

/** Bound local files before reading them, then validate before any migration. */
export async function readImportedSave(file: Pick<File, 'size' | 'text'>): Promise<StoredSave> {
  if (file.size > MAX_SAVE_BYTES) throw new SaveMigrationError(TOO_LARGE)
  return parseImportedSave(await file.text())
}

export function parseImportedSave(json: string): StoredSave {
  if (json.length > MAX_SAVE_BYTES) throw new SaveMigrationError(TOO_LARGE)
  let raw: unknown
  try { raw = JSON.parse(json) } catch { throw new SaveMigrationError('This file is not a CISO: First Year save.') }
  return migrateSave(raw)
}
