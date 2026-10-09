/**
 * `pnpm content:bundle [out.json]`
 *
 * Writes Nexora as a single pack file, in the shape `--pack` reads. It is
 * where a second organisation starts: copy it, change `meta.id`, and replace
 * the organisation one section at a time, running `pnpm validate:content
 * --pack` as you go (docs/CONTENT.md, "Starting a second campaign").
 */
import { writeFileSync } from 'node:fs'
import { nexoraContentRaw } from '../src/content/nexora'

const out = process.argv[2] ?? 'nexora-pack.json'
writeFileSync(out, `${JSON.stringify(nexoraContentRaw, null, 2)}\n`)
console.log(`Wrote ${out}`)
