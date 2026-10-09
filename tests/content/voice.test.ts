import { describe, expect, it } from 'vitest'
import { LESSONS } from '@/components/game/lessons'
import { nexoraContentRaw } from '@/content/nexora'
import { collectLines, voiceIssues, voiceRules } from '../../scripts/content/voice.ts'

/**
 * The mechanical half of docs/VOICE.md, held against every authored string
 * and every lesson. The same rules run on any pack through
 * `pnpm validate:content`. The other half — whether a line sounds like the
 * person saying it — needs a reader; this catches what a reader would
 * otherwise have to catch every time.
 */
const { lines, ids } = collectLines(nexoraContentRaw)
for (const lesson of LESSONS) lines.push({ where: `lesson ${lesson.id}`, text: `${lesson.title}. ${lesson.body}`, inCharacter: false })
const issues = voiceIssues(lines, ids)
const broken = (rule: string) => issues.filter((issue) => issue.rule === rule).map((issue) => `${issue.where}: ${issue.text}`)

describe('the voice (docs/VOICE.md)', () => {
  it('has enough to check', () => {
    expect(lines.length).toBeGreaterThan(1500)
    expect(ids.size).toBeGreaterThan(400)
    // Messages are in character; the rest is the game's own voice.
    expect(lines.filter((line) => line.where.startsWith('events')).every((line) => line.inCharacter)).toBe(true)
    expect(lines.filter((line) => line.where.startsWith('decisions')).some((line) => line.inCharacter)).toBe(false)
  })

  for (const rule of voiceRules(ids)) {
    it(`holds: ${rule.description}`, () => {
      expect(broken(rule.id)).toEqual([])
    })
  }
})
