import { describe, expect, it } from 'vitest'
import { nexoraContent } from '@/content/nexora'
import { eventWording } from '@/game/engine/tick'

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
      .flatMap((e) => [{ title: e.title, body: e.body }, ...(e.variants ?? [])].map((text) => ({ id: e.id, hit: `${text.title ?? ''} ${text.body}`.match(COUNT)?.[0] })))
      .filter((e) => e.hit)
      .map((e) => `${e.id} says "${e.hit}"`)
    expect(offenders).toEqual([])
  })

  it('say something different on a return visit', () => {
    // A year's inbox was 29% word-for-word repeats, up to eight of one
    // message, nearly all from the ten recurring events below.
    const frequent = [
      'evt-thr-false-positive', 'evt-thr-phishing-wave', 'evt-thr-credential-campaign', 'evt-org-quiet-week', 'evt-thr-scanning',
      'evt-thr-sector-ransomware', 'evt-thr-dark-web-credentials', 'evt-biz-outage-unrelated', 'evt-org-control-drift', 'evt-org-assumption-prompt',
    ]
    for (const id of frequent) {
      const def = nexoraContent.events.find((e) => e.id === id)!
      const texts = 1 + (def.variants ?? []).length
      expect(texts, id).toBeGreaterThanOrEqual(4)
      const said = Array.from({ length: texts }, (_, n) => eventWording(def, n + 1))
      expect(new Set(said.map((w) => w.body)).size, id).toBe(texts)
      expect(new Set(said.map((w) => w.title)).size, id).toBe(texts)
      expect(eventWording(def, texts + 1), id).toEqual(said[0])
    }
  })
})
