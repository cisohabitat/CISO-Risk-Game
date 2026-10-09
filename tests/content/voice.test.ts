import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LESSONS } from '@/components/game/lessons'

/**
 * The mechanical half of docs/VOICE.md, held against every authored string.
 * The other half — whether a line sounds like the person saying it — needs a
 * reader; this catches what a reader would otherwise have to catch every time.
 */
const ROOT = join(__dirname, '../../src/content/nexora')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : name.endsWith('.json') ? [path] : []
  })
}

interface Line {
  where: string
  text: string
  /** Said by a character in a message, rather than by the game itself. */
  inCharacter: boolean
}

const lines: Line[] = []
const ids = new Set<string>()

function walk(value: unknown, where: string, inCharacter: boolean): void {
  if (typeof value === 'string') {
    // Prose has spaces; ids, enums and tags do not.
    if (value.includes(' ')) lines.push({ where, text: value, inCharacter })
  } else if (Array.isArray(value)) {
    value.forEach((item, position) => walk(item, `${where}[${position}]`, inCharacter))
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'id' && typeof item === 'string' && item.includes('-')) ids.add(item)
      walk(item, `${where}.${key}`, inCharacter)
    }
  }
}

for (const path of files(ROOT)) {
  const name = relative(ROOT, path)
  // Messages are written in the sender's voice; everything else is the game's.
  walk(JSON.parse(readFileSync(path, 'utf8')), name, name.startsWith('events'))
}
for (const lesson of LESSONS) lines.push({ where: `lesson ${lesson.id}`, text: `${lesson.title}. ${lesson.body}`, inCharacter: false })

const offending = (test: (text: string) => boolean, only: (line: Line) => boolean = () => true) =>
  lines.filter((line) => only(line) && test(line.text)).map((line) => `${line.where}: ${line.text.slice(0, 90)}`)


describe('the voice (docs/VOICE.md)', () => {
  it('has enough to check', () => {
    expect(lines.length).toBeGreaterThan(1500)
    expect(ids.size).toBeGreaterThan(400)
  })

  it('is British English', () => {
    expect(offending((text) => /\b(organiz|prioritiz|analyz|recogniz|minimiz|maximiz|authoriz|utiliz|behavior|color|defense\b|center\b|favor|honor\b|catalog\b|modeling|traveled|canceled\b|programs\b)/i.test(text))).toEqual([])
  })

  it('never raises its voice', () => {
    expect(offending((text) => text.includes('!'))).toEqual([])
  })

  it('leaves typography to the interface', () => {
    expect(offending((text) => /[‘’“”]/.test(text))).toEqual([])
    expect(offending((text) => /\S {2,}\S/.test(text))).toEqual([])
  })

  it('dates things rather than counting days', () => {
    expect(offending((text) => /\bday \d+\b/i.test(text))).toEqual([])
  })

  it('names things rather than showing their ids', () => {
    const pattern = new RegExp(`(?<![\\w-])(${[...ids].map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`)
    expect(offending((text) => pattern.test(text.replace(/\{\{[^}]*\}\}/g, '')))).toEqual([])
  })

  it('does not judge, prescribe, score or play the hacker, in its own voice', () => {
    const own = (line: Line) => !line.inCharacter
    expect(offending((text) => /\b(congratulations|well done|great job|good job|nice work|awesome|amazing)\b/i.test(text), own)).toEqual([])
    expect(offending((text) => /\byou (should|must|ought to)\b/i.test(text), own)).toEqual([])
    expect(offending((text) => /\b(score|points|level up|achievement unlocked)\b/i.test(text), own)).toEqual([])
    expect(offending((text) => /\b(hackers?|hacked|1337|pwn\w*)\b/i.test(text), own)).toEqual([])
    expect(offending((text) => /\b(click|tap)\b/i.test(text), own)).toEqual([])
  })

  it('keeps even its characters out of the cartoon register', () => {
    expect(offending((text) => /\b(you'?ve been hacked|hackers?|1337|pwn\w*)\b/i.test(text))).toEqual([])
  })
})
