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
  const pending: { value: unknown; depth: number }[] = [{ value: raw, depth: 0 }]
  let entries = 1
  while (pending.length) {
    const { value, depth } = pending.pop()!
    if (depth > 64) throw new SaveMigrationError('That save contains too much nested data.')
    if (typeof value === 'number' && !Number.isFinite(value)) throw new SaveMigrationError('That save contains an invalid number.')
    if (!value || typeof value !== 'object') continue
    for (const key in value) {
      if (!Object.hasOwn(value, key)) continue
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new SaveMigrationError('That save contains an unsafe property.')
      }
      if (++entries > 500_000) throw new SaveMigrationError('That save contains too much nested data.')
      pending.push({ value: (value as Record<string, unknown>)[key], depth: depth + 1 })
    }
  }
  return migrateSave(raw)
}
