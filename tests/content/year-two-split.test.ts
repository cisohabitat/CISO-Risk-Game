import { describe, expect, it } from 'vitest'
import { isDeepStrictEqual } from 'node:util'
import { assembleNexora, YEAR_TWO_DECISIONS_BEFORE } from '@/content/nexora/assemble'
import { yearTwo } from '@/content/nexora/year-two'
import { nexoraContent } from '@/content/nexora'
import { validatedCampaign } from '@/lib/content/validate-content'
import type { CampaignContent } from '@/game/types'

// Year Two's events and decisions are a download of their own. A first year
// must stand on its own, and the two years together must be the campaign
// exactly as authored, in the same order: a save reproduces its own future
// only while the content order it was played under holds.
describe('the Year Two split', () => {
  const firstYear = assembleNexora() as CampaignContent
  const both = assembleNexora(yearTwo) as CampaignContent

  it('leaves the first year complete and valid on its own', () => {
    expect(() => validatedCampaign(firstYear)).not.toThrow()
    expect(firstYear.decisions.some((decision) => decision.id.startsWith('dec-y2-'))).toBe(false)
    expect(firstYear.events.some((event) => event.id.startsWith('evt-y2-'))).toBe(false)
  })

  it('puts Year Two back where it was authored', () => {
    expect(isDeepStrictEqual(both, nexoraContent)).toBe(true)
    const ids = both.decisions.map((decision) => decision.id)
    expect(ids.indexOf(YEAR_TWO_DECISIONS_BEFORE) - ids.indexOf('dec-y2-focus')).toBe(yearTwo.decisions.length)
    expect(both.events.length).toBe(firstYear.events.length + yearTwo.events.length)
  })
})
