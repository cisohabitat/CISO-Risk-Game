/**
 * `pnpm session <file>`: a playtest session log, read as the measures Phase 0
 * of docs/ROADMAP.md asks for. See docs/playtest-kit/README.md.
 */
import { readFileSync } from 'node:fs'
import { formatSummary, summariseSession } from './session/summary.ts'
import type { SessionLog } from '../src/store/session-log'

const path = process.argv[2]
if (!path) {
  console.error('Usage: pnpm session <ciso-session-YYYY-MM-DD.json>')
  process.exit(1)
}
const log = JSON.parse(readFileSync(path, 'utf8')) as SessionLog
if (log.version !== 1 || !Array.isArray(log.events)) {
  console.error(`${path} is not a session log from this game.`)
  process.exit(1)
}
console.log(formatSummary(summariseSession(log)))
