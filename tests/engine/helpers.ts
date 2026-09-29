import { buildContentIndex } from '@/game/engine/content-index'
import { parseCampaignContent } from '@/lib/content/validate-content'
import { nexoraContentRaw } from '@/content/nexora'
import type { ContentIndex } from '@/game/types'

let index: ContentIndex | undefined

/** Schema-validated campaign index shared by the engine tests. */
export function testIndex(): ContentIndex {
  if (!index) index = buildContentIndex(parseCampaignContent(nexoraContentRaw))
  return index
}
