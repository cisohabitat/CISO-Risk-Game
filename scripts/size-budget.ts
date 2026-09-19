/**
 * Build-output budget (plan §48).
 *
 * The campaign ships inside the client bundle, so every authored event adds to
 * what a first-time player downloads — 23 kB of consequence callbacks went in
 * without anybody noticing. This fails the build when a budget is exceeded, so
 * the cost of content is a decision rather than a drift.
 *
 * Budgets are transfer size (gzip), which is what a player actually waits for.
 */
import { gzipSync } from 'node:zlib'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

interface Budget {
  /** Chunk name prefix, as emitted into dist/assets. */
  name: string
  /** Maximum gzip kB. */
  limit: number
  why: string
}

const BUDGETS: Budget[] = [
  { name: 'index-', limit: 110, why: 'app code a player waits for before anything works' },
  { name: 'campaign-', limit: 75, why: 'the authored campaign; rises with every event written' },
  { name: 'react-', limit: 75, why: 'the framework' },
  { name: 'graph-', limit: 70, why: 'lazy-loaded, so this one is not in the critical path' },
]

/** Everything fetched before the first screen can be interactive. */
const CRITICAL_LIMIT_KB = 240

async function main(): Promise<void> {
  const dir = join(process.cwd(), 'dist', 'assets')
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    console.error('No dist/assets — run `pnpm build` first.')
    process.exit(1)
  }

  const sizes = new Map<string, number>()
  for (const entry of entries) {
    const bytes = await readFile(join(dir, entry))
    sizes.set(entry, gzipSync(bytes, { level: 9 }).byteLength / 1024)
  }

  const failures: string[] = []
  let critical = 0

  console.log('Transfer size (gzip), against budget:\n')
  for (const budget of BUDGETS) {
    const file = [...sizes.keys()].find((name) => name.startsWith(budget.name) && name.endsWith('.js'))
    if (!file) {
      failures.push(`no chunk named ${budget.name}* — the build output changed shape`)
      continue
    }
    const size = sizes.get(file)!
    // The graph is behind a dynamic import, so it is not in the critical path.
    if (!budget.name.startsWith('graph')) critical += size
    const verdict = size > budget.limit ? 'OVER' : 'ok'
    console.log(`  ${file.padEnd(34)} ${size.toFixed(1).padStart(6)} kB / ${String(budget.limit).padStart(3)} kB  ${verdict}  ${budget.why}`)
    if (size > budget.limit) failures.push(`${file} is ${size.toFixed(1)} kB gzip, over its ${budget.limit} kB budget`)
  }

  for (const [name, size] of sizes) {
    if (name.endsWith('.css')) critical += size
  }

  console.log(`\n  critical path ${critical.toFixed(1)} kB / ${CRITICAL_LIMIT_KB} kB (js and css before the first screen works)`)
  if (critical > CRITICAL_LIMIT_KB) {
    failures.push(`the critical path is ${critical.toFixed(1)} kB gzip, over its ${CRITICAL_LIMIT_KB} kB budget`)
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} budget failure(s):`)
    for (const failure of failures) console.error(`  ${failure}`)
    console.error('\nEither make it smaller or raise the budget deliberately, in scripts/size-budget.ts.')
    process.exit(1)
  }
  console.log('\nWithin budget.')
}

void main()
