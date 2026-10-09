import { describe, expect, it } from 'vitest'
import { readSeedLink, seedLinkUrl } from '@/lib/seed-link'
import { shareYear } from '@/lib/share-year'

/** Phase 6 of docs/ROADMAP.md: a year as a link, and a finished year to send. */
const situations = ['sit-breach', 'sit-money']

describe('a link to a year', () => {
  it('opens on the seed, mode and situation it names', () => {
    expect(readSeedLink('?seed=harbour-12&mode=high-pressure&situation=sit-breach', situations)).toEqual({
      seed: 'harbour-12',
      mode: 'high-pressure',
      situation: 'sit-breach',
    })
    expect(readSeedLink('?seed=harbour-12&situation=surprise', situations)).toEqual({ seed: 'harbour-12', situation: 'surprise' })
  })

  it('ignores what it does not recognise rather than guessing', () => {
    expect(readSeedLink('?seed=<script>&mode=impossible&situation=sit-nowhere', situations)).toEqual({})
    expect(readSeedLink(`?seed=${'x'.repeat(65)}`, situations)).toEqual({})
    expect(readSeedLink('', situations)).toEqual({})
  })

  it('writes a link that reads back as the same year', () => {
    const url = seedLinkUrl('https://example.test', { seed: 'kestrel-7', mode: 'ciso', situation: 'sit-money' })
    expect(url).toBe('https://example.test/?seed=kestrel-7&mode=ciso&situation=sit-money')
    expect(readSeedLink(new URL(url).search, situations)).toEqual({ seed: 'kestrel-7', mode: 'ciso', situation: 'sit-money' })
  })
})

describe('a finished year, to send', () => {
  const review = {
    headline: 'Tested, and it held.',
    performanceBand: 'Credible first year',
    dimensions: [
      { id: 'resilience', label: 'Resilience', band: 'solid' as const, narrative: '', evidence: [] },
      { id: 'team', label: 'Team sustainability', band: 'developing' as const, narrative: '', evidence: [] },
    ],
  }
  const shared = shareYear(review, { organisation: 'Nexora Group', seed: 'kestrel-7', mode: 'ciso', situationId: 'sit-money', situationName: 'New money' }, 'https://example.test')

  it('carries the headline, the reading on each dimension and a link to the same year', () => {
    expect(shared.text).toContain('My first year as CISO of Nexora Group (CISO, New money):')
    expect(shared.text).toContain('"Tested, and it held."')
    expect(shared.text).toContain('Resilience: solid')
    expect(shared.text).toContain('Team sustainability: developing')
    expect(shared.text).toContain('Play the same year: https://example.test/?seed=kestrel-7&mode=ciso&situation=sit-money')
  })

  it('has no score in it, because there is none', () => {
    expect(shared.text).not.toMatch(/\bscore\b|\bpoints?\b|\d+\s*(%|\/\s*\d)/i)
  })
})
