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
import voiceEvents from '../src/assets/voice/event-ids.json'

interface Budget {
  /** Chunk name prefix, as emitted into dist/assets. */
  name: string
  /** Maximum gzip kB. */
  limit: number
  why: string
}

const BUDGETS: Budget[] = [
  { name: 'index-', limit: 105, why: 'app code a player waits for before anything works' },
  // Loaded on demand, and fetched while the start screen is up, so it no
  // longer delays the first screen; it still has to arrive before the first
  // day can be played. Raised from 77 when it left the first load, to leave
  // room for roughly sixty more short letters before this is looked at again.
  // The owner-approved AI-accelerated exploit and five replies take the campaign
  // from 89.3 to 90.8 KiB. First-screen and complete-visit limits stay unchanged.
  { name: 'campaign-', limit: 92, why: 'the authored campaign, loaded when a campaign opens' },
  { name: 'react-', limit: 75, why: 'the framework' },
  { name: 'OrgGraph-', limit: 70, why: 'the graph library, which must stay out of the first load' },
]

/**
 * Chunks that must never appear in the entry HTML. The graph is the whole
 * reason the organisation view is code-split; if it is preloaded or its
 * stylesheet blocks rendering, the split has bought nothing. The year view is
 * split for headroom: it is opened a few times a year and read at the close.
 * The campaign and its loader (with the schema library) are split because the
 * start screen needs neither, and they were most of what it waited for.
 */
const MUST_STAY_LAZY = ['migrations-', 'save-safety-', 'InboxScreen-', 'OrgGraph-', 'CampaignFeedbackView-', 'DebriefScreen-', 'campaign-', 'loader-', 'next-year-', 'CharacterVoicePlayer-']

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
 *
 * Lowered from 260 to 185 when the campaign content left the first load: the
 * first screen fell from 258.2 kB to 176.7 kB, and the limit is set just above
 * that so the gain cannot drift away unnoticed.
 */
// The editorial pass adds a 23.2 KiB self-hosted display face. Fonts are now
// counted below as well as JS/CSS; the old 185 KiB gate did not count them.
// Security import validation and its module boundary add roughly 0.3 KiB.
const CRITICAL_LIMIT_KB = 221

// The approved illustrated start screen adds one responsive decorative image.
// Account for it explicitly; neither variant may silently grow, and phones
// must not pay for the desktop scene. Browser coverage checks that selection.
const START_ART = [
  { name: 'start-desktop-', limit: 135, renderLimit: 350, visitLimit: 450 },
  { name: 'start-mobile-', limit: 90, renderLimit: 320, visitLimit: 410 },
]

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
    sizes.set(entry, (entry.endsWith('.woff2') ? bytes.byteLength : gzipSync(bytes, { level: 9 }).byteLength) / 1024)
  }

  const failures: string[] = []

  // What the entry HTML itself asks for before the first screen: the module
  // script, anything it preloads, and every blocking stylesheet.
  const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  const firstLoad = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)]
    .map((match) => match[1]!)
    .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
  const inFirstLoad = new Set(firstLoad)
  // A self-hosted font is a real first-visit transfer even without a preload.
  // Count CSS font URLs so adding another face cannot bypass the budget.
  for (const file of firstLoad.filter((entry) => entry.endsWith('.css'))) {
    const css = await readFile(join(dir, file), 'utf8')
    for (const match of css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)) {
      const font = match[1]!.split('/').at(-1)!
      inFirstLoad.add(font)
    }
  }

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
  console.log(`  critical path ${critical.toFixed(1)} kB / ${CRITICAL_LIMIT_KB} kB (js, css and self-hosted fonts)`)
  if (critical > CRITICAL_LIMIT_KB) {
    failures.push(`the critical path is ${critical.toFixed(1)} kB gzip, over its ${CRITICAL_LIMIT_KB} kB budget`)
  }

  console.log('\n  Title artwork (encoded bytes, one responsive scene per visit):')
  // ensureCampaign also warms these lazy chunks while the title is visible.
  // They are not render-blocking, but they still contribute to the visit.
  const prefetch = [...sizes.entries()]
    .filter(([file]) => /^(campaign|loader)-.*\.js$/.test(file) && !inFirstLoad.has(file))
    .reduce((sum, [, size]) => sum + size, 0)
  for (const art of START_ART) {
    const file = entries.find((entry) => entry.startsWith(art.name) && entry.endsWith('.webp'))
    if (!file) {
      failures.push(`missing ${art.name}*.webp title artwork`)
      continue
    }
    const size = (await readFile(join(dir, file))).byteLength / 1024
    const total = critical + size
    const visit = total + prefetch
    console.log(`  ${file}: ${size.toFixed(1)} KiB / ${art.limit} KiB; rendering ${total.toFixed(1)} KiB / ${art.renderLimit} KiB`)
    console.log(`    with ${prefetch.toFixed(1)} KiB background campaign prefetch: ${visit.toFixed(1)} KiB / ${art.visitLimit} KiB`)
    if (size > art.limit) failures.push(`${file} exceeds its ${art.limit} KiB artwork budget`)
    if (total > art.renderLimit) failures.push(`${art.name} rendering exceeds its ${art.renderLimit} KiB budget`)
    if (visit > art.visitLimit) failures.push(`${art.name} visit including prefetch exceeds its ${art.visitLimit} KiB budget`)
  }

  const office = entries.find((entry) => entry.startsWith('nexora-office-') && entry.endsWith('.webp'))
  if (!office) failures.push('missing deferred office artwork')
  else {
    const size = (await readFile(join(dir, office))).byteLength / 1024
    console.log(`\n  Office atlas (after play begins): ${size.toFixed(1)} KiB / 160 KiB`)
    if (size > 160) failures.push('office atlas exceeds its 160 KiB budget')
    if (html.includes(office)) failures.push('office atlas must not be fetched by the title screen')
  }

  const voices = entries.filter((entry) => entry.endsWith('.mp3'))
  let voiceTotal = 0
  if (voices.length !== voiceEvents.length) failures.push('voice clips must match the generated catalogue')
  for (const id of voiceEvents) {
    if (!voices.some((entry) => entry.startsWith(`${id}-`))) failures.push(`missing voice clip: ${id}`)
  }
  for (const voice of voices) {
    const size = (await readFile(join(dir, voice))).byteLength / 1024
    voiceTotal += size
    if (size > 160) failures.push(`${voice} exceeds the 160 KiB clip budget`)
    if (html.includes(voice)) failures.push('voice clips must not load with the title screen')
  }
  // Owner-requested expansion: 34 clips across the 12-character cast, including the team introduction.
  console.log(`\n  Character voice (on request): ${voiceTotal.toFixed(1)} KiB / 3072 KiB`)
  if (voiceTotal > 3072) failures.push('character voice exceeds its 3072 KiB total budget')

  if (failures.length > 0) {
    console.error(`\n${failures.length} budget failure(s):`)
    for (const failure of failures) console.error(`  ${failure}`)
    console.error('\nEither make it smaller or raise the budget deliberately, in scripts/size-budget.ts.')
    process.exit(1)
  }
  console.log('\nWithin budget.')
}

void main()
