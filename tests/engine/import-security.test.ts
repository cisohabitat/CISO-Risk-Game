import { describe, expect, it, vi } from 'vitest'
import { MAX_SAVE_BYTES, parseImportedSave, readImportedSave } from '@/store/import-save'
import { exportSave } from '@/store/persistence'
import { newGame } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

const state = newGame(testIndex(), { seed: 'safe-import' })
const json = exportSave(state, 'CISO: First Year')

describe('untrusted save files', () => {
  it('preserves a legitimate campaign round trip', () => {
    expect(parseImportedSave(json).state).toEqual(state)
  })

  it('rejects oversized files before reading them', async () => {
    const text = vi.fn(async () => json)
    await expect(readImportedSave({ size: MAX_SAVE_BYTES + 1, text })).rejects.toThrow('16 MiB')
    expect(text).not.toHaveBeenCalled()
    expect(() => parseImportedSave(' '.repeat(MAX_SAVE_BYTES + 1))).toThrow('16 MiB')
  })

  it.each(['__proto__', 'constructor', 'prototype'])('rejects nested %s keys before migration', (key) => {
    const raw = JSON.parse(json)
    raw.state.flags = JSON.parse(`{"${key}":{"polluted":true}}`)
    expect(() => parseImportedSave(JSON.stringify(raw))).toThrow('unsafe property')
  })

  it('rejects excessive nesting and non-finite JSON numbers', () => {
    const raw = JSON.parse(json)
    raw.state.flags.deep = JSON.parse('['.repeat(70) + '0' + ']'.repeat(70))
    expect(() => parseImportedSave(JSON.stringify(raw))).toThrow('nested data')
    expect(() => parseImportedSave(json.replace(/"currentDay":\s*\d+/, '"currentDay": 1e999'))).toThrow('invalid number')
    expect(() => parseImportedSave('{')).toThrow('not a CISO')
  })

  it('rejects wide payloads below the file size limit', () => {
    expect(() => parseImportedSave(JSON.stringify(Array(500_001).fill(0)))).toThrow('nested data')
  })
})
