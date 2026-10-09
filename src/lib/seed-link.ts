/**
 * A link to a particular year (docs/ROADMAP.md, Phase 6): the seed, the mode
 * and the situation, so two people can play the same Nexora and compare, or a
 * class can all start from one. `/?seed=harbour-1&mode=ciso&situation=…`.
 *
 * The same seed, mode and situation always make the same world, so a link is
 * the year itself, not a copy of anyone's save: it carries nothing they did.
 */
import type { Difficulty } from '@/game/types'

export interface SeedLink {
  seed?: string
  mode?: Difficulty
  situation?: string
}

const MODES: Difficulty[] = ['guided', 'ciso', 'high-pressure']

/** What a link asks for, keeping only what makes sense. */
export function readSeedLink(search: string, situations: string[]): SeedLink {
  let params: URLSearchParams
  try {
    params = new URLSearchParams(search)
  } catch {
    return {}
  }
  const seed = params.get('seed')?.trim()
  const mode = params.get('mode')
  const situation = params.get('situation')
  return {
    ...(seed && /^[\w.-]{1,64}$/.test(seed) ? { seed } : {}),
    ...(mode && (MODES as string[]).includes(mode) ? { mode: mode as Difficulty } : {}),
    ...(situation && (situation === 'surprise' || situations.includes(situation)) ? { situation } : {}),
  }
}

/** The address of a year, to share. */
export function seedLinkUrl(origin: string, link: Required<Pick<SeedLink, 'seed' | 'mode'>> & Pick<SeedLink, 'situation'>): string {
  const params = new URLSearchParams({ seed: link.seed, mode: link.mode })
  if (link.situation) params.set('situation', link.situation)
  return `${origin}/?${params.toString()}`
}
