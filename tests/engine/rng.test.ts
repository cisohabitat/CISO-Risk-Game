import { describe, expect, it } from 'vitest'
import { createRng, deriveRng } from '@/game/engine/rng'

describe('seeded rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng('seed-a')
    const b = createRng('seed-a')
    const first = Array.from({ length: 50 }, () => a.next())
    const second = Array.from({ length: 50 }, () => b.next())
    expect(first).toEqual(second)
  })

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 20 }, (_, i) => createRng('seed-a', i).next())
    const b = Array.from({ length: 20 }, (_, i) => createRng('seed-b', i).next())
    expect(a).not.toEqual(b)
  })

  it('resumes exactly from a persisted cursor', () => {
    const a = createRng('resume', 0)
    for (let i = 0; i < 17; i += 1) a.next()
    const resumed = createRng('resume', a.cursor)
    const continued = createRng('resume', 0)
    for (let i = 0; i < 17; i += 1) continued.next()
    expect(resumed.next()).toBe(continued.next())
  })

  it('stays within bounds', () => {
    const rng = createRng('bounds')
    for (let i = 0; i < 2000; i += 1) {
      const value = rng.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
    for (let i = 0; i < 200; i += 1) {
      const value = rng.int(3, 7)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(7)
    }
  })

  it('weights selection proportionally', () => {
    const rng = createRng('weights')
    const items = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 9 },
    ]
    const counts: Record<string, number> = { a: 0, b: 0 }
    for (let i = 0; i < 4000; i += 1) {
      const picked = rng.weighted(items, (item) => item.weight)
      if (picked) counts[picked.id] = (counts[picked.id] ?? 0) + 1
    }
    expect(counts.b).toBeGreaterThan(counts.a * 5)
  })

  it('gives independent streams per purpose', () => {
    const world = deriveRng('seed', 'world')
    const people = deriveRng('seed', 'people')
    expect(world.next()).not.toBe(people.next())
  })

  it('never calls Math.random anywhere in the simulation engine', async () => {
    const { readdir, readFile } = await import('node:fs/promises')
    const root = new URL('../../src/game/', import.meta.url)
    const files: URL[] = []
    const walk = async (dir: URL) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
        if (entry.isDirectory()) await walk(child)
        else if (entry.name.endsWith('.ts')) files.push(child)
      }
    }
    await walk(root)
    expect(files.length).toBeGreaterThan(10)
    for (const file of files) {
      const source = await readFile(file, 'utf8')
      const code = source
        .split('\n')
        // Strip comments: the rule is about calls, not about discussing the rule.
        .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//') && !line.trimStart().startsWith('/*'))
        .join('\n')
      expect(code, `${file.pathname} calls Math.random`).not.toContain('Math.random(')
    }
  })
})

describe('difficulty is described in one place', () => {
  it('branches on difficulty only in the profile that defines it', async () => {
    const { readdir, readFile } = await import('node:fs/promises')
    const root = new URL('../../src/game/', import.meta.url)
    const files: URL[] = []
    const walk = async (dir: URL) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
        if (entry.isDirectory()) await walk(child)
        else if (entry.name.endsWith('.ts')) files.push(child)
      }
    }
    await walk(root)

    const offenders: string[] = []
    for (const file of files) {
      // setup.ts is where the profiles live, so it is allowed to name modes.
      if (file.pathname.endsWith('/engine/setup.ts')) continue
      const source = await readFile(file, 'utf8')
      const code = source
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//') && !line.trimStart().startsWith('/*'))
        .join('\n')
      // A comparison against a mode name is a second, hidden copy of what the
      // profile is supposed to say. Indexing DIFFICULTY_PROFILES is fine.
      if (/difficulty\s*===\s*['"]/.test(code)) offenders.push(file.pathname)
    }
    expect(offenders, `these compare difficulty to a mode name instead of reading the profile:\n${offenders.join('\n')}`).toEqual([])
  })
})
