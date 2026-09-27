import { describe, expect, it } from 'vitest'
import { nexoraContent } from '@/content/nexora'

/**
 * A message that can arrive more than once says the same words every time.
 * Reading three whole years found a "third ransomware case this quarter" on
 * day 13 and five times after, the same "eleven finance staff" seven times, a
 * printer that was never fixed and a four-hour outage that always lasted four
 * hours. A recurring message can describe a recurring pattern; it cannot
 * state a count, because every repeat states the same one.
 */
const COUNT = /\b(\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|second|third|fourth|fifth)\b/i

describe('recurring messages', () => {
  it('state no specific count', () => {
    const offenders = nexoraContent.events
      .filter((e) => !e.oncePerCampaign && !e.scheduledOnly)
      .map((e) => ({ id: e.id, hit: `${e.title} ${e.body}`.match(COUNT)?.[0] }))
      .filter((e) => e.hit)
      .map((e) => `${e.id} says "${e.hit}"`)
    expect(offenders).toEqual([])
  })
})
