/**
 * `pnpm session <file> [more files…]`: playtest session logs, read as the
 * measures Phase 0 of docs/ROADMAP.md asks for. One file prints that
 * session; several print each, then the middle of each measure across them.
 * See docs/playtest-kit/README.md.
 */
import { readFileSync } from 'node:fs'
import { aggregateSessions, formatSummary, summariseSession } from './session/summary.ts'
import type { SessionLog } from '../src/store/session-log'

const paths = process.argv.slice(2)
if (paths.length === 0) {
  console.error('Usage: pnpm session <ciso-session-YYYY-MM-DD.json> [more files]')
  process.exit(1)
}
const summaries = paths.map((path) => {
  const log = JSON.parse(readFileSync(path, 'utf8')) as SessionLog
  if (log.version !== 1 || !Array.isArray(log.events)) {
    console.error(`${path} is not a session log from this game.`)
    process.exit(1)
  }
  return summariseSession(log)
})
for (const [position, summary] of summaries.entries()) {
  if (summaries.length > 1) console.log(`\n== ${paths[position]}`)
  console.log(formatSummary(summary))
}
if (summaries.length > 1) console.log(`\n== Across all\n${aggregateSessions(summaries)}`)
