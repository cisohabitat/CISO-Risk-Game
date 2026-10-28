/**
 * Loads and indexes campaign content, on demand: the store calls this when a
 * campaign is about to open, not when the app starts.
 *
 * A first year loads without Year Two's events and decisions, which are a
 * download of their own fetched when a second year begins or a second-year
 * save opens. The full index is a superset, and a first year played under it
 * ends exactly as it would without it, so once loaded it stays.
 *
 * In development the bundle is schema-validated on load so authoring mistakes
 * surface immediately. In production the validated bundle ships as-is, because
 * re-validating several hundred records on every start costs time for nothing,
 * and the validator is not even downloaded.
 */
import { buildContentIndex } from '@/game/engine/content-index'
import type { CampaignContent, ContentIndex } from '@/game/types'
import { assembleNexora } from '@/content/nexora/assemble'

let firstYear: ContentIndex | undefined
let bothYears: ContentIndex | undefined

export async function loadCampaign(options: { yearTwo?: boolean } = {}): Promise<ContentIndex> {
  if (bothYears) return bothYears
  if (!options.yearTwo && firstYear) return firstYear
  const raw = options.yearTwo ? assembleNexora((await import('@/content/nexora/year-two')).yearTwo) : assembleNexora()
  let content = raw as CampaignContent
  if (import.meta.env?.DEV) {
    const { validatedCampaign } = await import('./validate-content')
    content = validatedCampaign(raw)
  }
  const index = buildContentIndex(content)
  if (options.yearTwo) bothYears = index
  else firstYear = index
  return index
}

/** Test helper: forget the memoised indexes. */
export function resetCampaignCache(): void {
  firstYear = undefined
  bothYears = undefined
}
