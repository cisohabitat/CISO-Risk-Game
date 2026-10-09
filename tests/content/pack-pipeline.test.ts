import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { nexoraContentRaw } from '@/content/nexora'
import { parseCampaignContent } from '@/lib/content/validate-content'
import { validateCampaignContent } from '@/lib/content/validate'
import { budgetReport } from '../../scripts/content/budget.ts'
import { packArgument } from '../../scripts/content/pack.ts'
import { packJsonSchema, SCHEMA_PATH } from '../../scripts/content/schema.ts'
import { collectLines, voiceIssues } from '../../scripts/content/voice.ts'

/**
 * Phase 2 of docs/ROADMAP.md: a second organisation is a pack, and the
 * checks Nexora passes have to run on any pack before one is written.
 */
const asPackFile = () => JSON.parse(JSON.stringify(nexoraContentRaw)) as Record<string, unknown[]> & { meta: Record<string, unknown> }

describe('the content pipeline, on any pack', () => {
  it('takes a pack from the command line', () => {
    expect(packArgument(['60'])).toEqual({ rest: ['60'] })
    expect(packArgument(['60', '--pack', 'hospital.json'])).toEqual({ path: 'hospital.json', rest: ['60'] })
    expect(() => packArgument(['--pack'])).toThrow(/needs a path/)
  })

  it('passes Nexora through the pack path as written to a file', () => {
    const pack = asPackFile()
    const content = parseCampaignContent(pack)
    expect(validateCampaignContent(content).filter((issue) => issue.severity === 'error')).toEqual([])
    const { lines, ids } = collectLines(pack)
    expect(voiceIssues(lines, ids)).toEqual([])
    expect(budgetReport(content).filter((line) => line.short)).toEqual([])
  })

  it('catches a broken reference, a broken voice and a thin pack', () => {
    const pack = asPackFile()
    const edges = pack.edges as { to: string }[]
    edges[0]!.to = 'node-that-does-not-exist'
    const events = pack.events as { title: string }[]
    events.length = 10
    const decisions = pack.decisions as { title: string }[]
    decisions[0]!.title = 'Well done! Now prioritize'

    const content = parseCampaignContent(pack)
    expect(validateCampaignContent(content).some((issue) => issue.severity === 'error' && issue.detail.includes('node-that-does-not-exist'))).toBe(true)
    const { lines, ids } = collectLines(pack)
    expect(voiceIssues(lines, ids).map((issue) => issue.rule).sort()).toEqual(['british-english', 'exclamation', 'praise'])
    expect(budgetReport(content).find((line) => line.what === 'Event pool')).toMatchObject({ has: 10, short: true })
  })

  it('publishes the schema an author can check a pack against, kept up to date', () => {
    // Regenerate with `pnpm content:schema` when the content schema changes.
    expect(readFileSync(SCHEMA_PATH, 'utf8')).toBe(packJsonSchema())
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as { required: string[] }
    expect(schema.required).toEqual(expect.arrayContaining(['meta', 'nodes', 'decisions', 'events']))
  })
})
