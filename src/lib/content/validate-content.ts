/**
 * Schema and referential validation of campaign content. The loader brings
 * this in only in development, so the schema library is not part of what a
 * production player downloads on the way to their first day.
 */
import type { CampaignContent } from '@/game/types'
import { campaignContentSchema } from '@/lib/schemas/content'
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

/** Parses and checks the content, throwing on any error-severity issue. */
export function validatedCampaign(raw: unknown): CampaignContent {
  const content = parseCampaignContent(raw)
  const issues = validateCampaignContent(content).filter((issue) => issue.severity === 'error')
  if (issues.length > 0) throw new ContentValidationError(issues)
  return content
}
