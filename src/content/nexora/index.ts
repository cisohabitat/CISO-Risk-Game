/**
 * The whole Nexora campaign, both years, for the harnesses, the content
 * validator and tests.
 *
 * The app does not import this: its loader (`src/lib/content/loader.ts`)
 * assembles the first year and fetches Year Two only when it is needed.
 */
import { assembleNexora } from './assemble'
import { yearTwo } from './year-two'
import type { CampaignContent } from '@/game/types'

/** Assembled, unvalidated campaign content. Validation happens in the loader. */
export const nexoraContentRaw: unknown = assembleNexora(yearTwo)

/** Typed view for callers that have already validated (or trust) the bundle. */
export const nexoraContent = nexoraContentRaw as CampaignContent
