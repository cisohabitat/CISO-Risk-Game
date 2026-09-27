/**
 * Build-output budget (plan §48).
 *
 * The campaign ships inside the client bundle, so every authored event adds to
 * what a first-time player downloads — 23 kB of consequence callbacks went in
 * without anybody noticing. This fails the build when a budget is exceeded, so
 * the cost of content is a decision rather than a drift.
 *
 * Budgets are transfer size (gzip), which is what a player actually waits for.
 *
 * **The critical path is read out of `dist/index.html`, not assumed.** It used
 * to be a hand-kept sum that excluded the graph because the graph is behind a
 * dynamic import. It was not: naming `@xyflow` as a manual chunk made it a
 * shared chunk, and the entry HTML carried a `modulepreload` for its 59 kB and
 * a render-blocking `<link>` for its stylesheet. The budget said 241 kB while a
 * first-time player fetched 301 kB. Whatever the entry HTML asks for before the
 * first screen is what counts here, so that cannot happen again quietly.
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
  { name: 'campaign-', limit: 77, why: 'the authored campaign; rises with every event written' },
  { name: 'react-', limit: 75, why: 'the framework' },
  { name: 'OrgGraph-', limit: 70, why: 'the graph library, which must stay out of the first load' },
]

/**
 * Chunks that must never appear in the entry HTML. The graph is the whole
 * reason the organisation view is code-split; if it is preloaded or its
 * stylesheet blocks rendering, the split has bought nothing. The year view is
 * split for headroom: it is opened a few times a year and read at the close.
 */
const MUST_STAY_LAZY = ['OrgGraph-', 'DebriefScreen-']

/**
 * Everything the entry HTML fetches before the first screen can be
 * interactive, measured rather than assumed. Raised from 240 when the
 * measurement was corrected: the old figure left out a 59 kB chunk the entry
 * was preloading, so 240 was never the real number. The real one fell by
 * about 50 kB when the graph was made genuinely lazy, and this is set just
 * above where that leaves it.
 *
 * Raised from 255 to 260, and the campaign from 75 to 77, as a decision: the
 * owner asked for more late-year content and more replay value, and the
 * fourth-quarter decisions, four starting situations with a decision each,
 * and reworded recurring messages cost about 12 kB of campaign between them.
 * Still set just above where that leaves the build (257.4 kB, 74.0 kB).
 */
const CRITICAL_LIMIT_KB = 260

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

  // What the entry HTML itself asks for before the first screen: the module
  // script, anything it preloads, and every blocking stylesheet.
  const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  const firstLoad = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)]
    .map((match) => match[1]!)
    .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
  const inFirstLoad = new Set(firstLoad)

  console.log('Transfer size (gzip), against budget:\n')
  for (const budget of BUDGETS) {
    const file = [...sizes.keys()].find((name) => name.startsWith(budget.name) && name.endsWith('.js'))
    if (!file) {
      failures.push(`no chunk named ${budget.name}* — the build output changed shape`)
      continue
    }
    const size = sizes.get(file)!
    const verdict = size > budget.limit ? 'OVER' : 'ok'
    const where = inFirstLoad.has(file) ? 'first load' : 'on demand'
    console.log(
      `  ${file.padEnd(34)} ${size.toFixed(1).padStart(6)} kB / ${String(budget.limit).padStart(3)} kB  ${verdict}  ${where}  ${budget.why}`,
    )
    if (size > budget.limit) failures.push(`${file} is ${size.toFixed(1)} kB gzip, over its ${budget.limit} kB budget`)
  }

  for (const prefix of MUST_STAY_LAZY) {
    // A split that quietly stops happening folds the chunk back into the app,
    // which the leak check below cannot see.
    if (![...sizes.keys()].some((name) => name.startsWith(prefix) && name.endsWith('.js'))) {
      failures.push(`no chunk named ${prefix}* — it is meant to be split out and loaded on demand`)
    }
    const leaked = [...inFirstLoad].filter((file) => file.startsWith(prefix))
    for (const file of leaked) {
      failures.push(`${file} is fetched before the first screen; it is meant to load only when it is needed`)
    }
  }

  let critical = 0
  const missing: string[] = []
  for (const file of inFirstLoad) {
    const size = sizes.get(file)
    if (size === undefined) missing.push(file)
    else critical += size
  }
  if (missing.length > 0) failures.push(`the entry HTML asks for files that are not in dist/assets: ${missing.join(', ')}`)

  console.log(`\n  first load, from index.html: ${[...inFirstLoad].sort().join(', ')}`)
  console.log(`  critical path ${critical.toFixed(1)} kB / ${CRITICAL_LIMIT_KB} kB (js and css before the first screen works)`)
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
