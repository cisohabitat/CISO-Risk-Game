/**
 * A finished year, as something to send (docs/ROADMAP.md, Phase 6): the
 * review's headline and its reading on each dimension, and a link that opens
 * the same year for whoever receives it. There is no score in it, because
 * there is no score: the bands are the review's own words.
 */
import type { AnnualReview, Difficulty } from '@/game/types'
import { seedLinkUrl } from './seed-link'

const MODE_NAME: Record<Difficulty, string> = { guided: 'Guided', ciso: 'CISO', 'high-pressure': 'High pressure' }

export interface SharedYear {
  title: string
  text: string
  url: string
}

export function shareYear(
  review: Pick<AnnualReview, 'headline' | 'performanceBand' | 'dimensions'>,
  year: { organisation: string; seed: string; mode: Difficulty; situationId?: string; situationName?: string },
  origin: string,
): SharedYear {
  const url = seedLinkUrl(origin, { seed: year.seed, mode: year.mode, situation: year.situationId })
  const opening = [MODE_NAME[year.mode], year.situationName].filter(Boolean).join(', ')
  const text = [
    `My first year as CISO of ${year.organisation} (${opening}):`,
    `"${review.headline}"`,
    review.performanceBand,
    '',
    ...review.dimensions.map((dimension) => `${dimension.label}: ${dimension.band}`),
    '',
    `Play the same year: ${url}`,
  ].join('\n')
  return { title: `CISO: First Year — ${review.headline}`, text, url }
}

/** Hands the year to the system's share sheet, or the clipboard. */
export async function sendYear(shared: SharedYear): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: shared.title, text: shared.text })
      return 'shared'
    }
  } catch (error) {
    // Closing the share sheet is the player's choice, not a failure.
    if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
  }
  try {
    await navigator.clipboard.writeText(shared.text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
