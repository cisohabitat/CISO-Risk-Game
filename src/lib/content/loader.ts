/**
 * Loads and indexes campaign content.
 *
 * In development the bundle is schema-validated on load so authoring mistakes
 * surface immediately. In production the validated bundle ships as-is, because
 * re-validating several hundred records on every start costs time for nothing.
 */
import { buildContentIndex } from '@/game/engine/content-index'
import type { CampaignContent, ContentIndex } from '@/game/types'
import { campaignContentSchema } from '@/lib/schemas/content'
import { nexoraContentRaw } from '@/content/nexora'
import { validateCampaignContent, type ContentIssue } from './validate'

export class ContentValidationError extends Error {
  readonly issues: ContentIssue[] | string

  constructor(issues: ContentIssue[] | string) {
    super(typeof issues === 'string' ? issues : `Campaign content is invalid (${issues.length} issues)`)
    this.name = 'ContentValidationError'
    this.issues = issues
  }
}

export function parseCampaignContent(raw: unknown): CampaignContent {
  const result = campaignContentSchema.safeParse(raw)
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 12)
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new ContentValidationError(detail)
  }
  return result.data as unknown as CampaignContent
}

let cached: ContentIndex | undefined

export function loadCampaign(options: { validate?: boolean } = {}): ContentIndex {
  if (cached) return cached
  const shouldValidate = options.validate ?? import.meta.env?.DEV ?? false
  const content = shouldValidate
    ? parseCampaignContent(nexoraContentRaw)
    : (nexoraContentRaw as CampaignContent)
  if (shouldValidate) {
    const issues = validateCampaignContent(content).filter((issue) => issue.severity === 'error')
    if (issues.length > 0) throw new ContentValidationError(issues)
  }
  cached = buildContentIndex(content)
  return cached
}

/** Test helper: forget the memoised index. */
export function resetCampaignCache(): void {
  cached = undefined
}
