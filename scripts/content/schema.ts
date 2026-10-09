import { z } from 'zod'
import { campaignContentSchema } from '../../src/lib/schemas/content'

export const SCHEMA_PATH = 'docs/content/campaign.schema.json'

/** The pack schema as JSON Schema, as written to SCHEMA_PATH. */
export function packJsonSchema(): string {
  const schema = z.toJSONSchema(campaignContentSchema, { unrepresentable: 'any' })
  return `${JSON.stringify({ title: 'CISO: First Year campaign pack', ...schema }, null, 2)}\n`
}
