/**
 * `pnpm content:schema`
 *
 * Writes the campaign pack's JSON Schema to docs/content/campaign.schema.json,
 * generated from the same schema the game validates content with, so an
 * author's editor can check a pack as it is written.
 * tests/content/pack-pipeline.test.ts fails if the file falls behind.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { packJsonSchema, SCHEMA_PATH } from './content/schema.ts'

mkdirSync('docs/content', { recursive: true })
writeFileSync(SCHEMA_PATH, packJsonSchema())
console.log(`Wrote ${SCHEMA_PATH}`)
