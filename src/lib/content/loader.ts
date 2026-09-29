/**
 * Loads and indexes campaign content, on demand: the store calls this when a
 * campaign is about to open, not when the app starts.
 *
 * In development the bundle is schema-validated on load so authoring mistakes
 * surface immediately. In production the validated bundle ships as-is, because
 * re-validating several hundred records on every start costs time for nothing,
 * and the validator is not even downloaded.
 */
import { buildContentIndex } from '@/game/engine/content-index'
import type { CampaignContent, ContentIndex } from '@/game/types'
import { nexoraContentRaw } from '@/content/nexora'

let cached: ContentIndex | undefined

export async function loadCampaign(): Promise<ContentIndex> {
  if (cached) return cached
  let content = nexoraContentRaw as CampaignContent
  if (import.meta.env?.DEV) {
    const { validatedCampaign } = await import('./validate-content')
    content = validatedCampaign(nexoraContentRaw)
  }
  cached = buildContentIndex(content)
  return cached
}

/** Test helper: forget the memoised index. */
export function resetCampaignCache(): void {
  cached = undefined
}
