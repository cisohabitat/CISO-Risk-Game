/**
 * Which campaign pack a content script works on. Nexora by default; any
 * other pack as a single JSON file in the bundled shape (`pnpm content:bundle`
 * writes Nexora in that shape, as the place to start a second organisation).
 *
 *   pnpm validate:content --pack path/to/pack.json
 *   pnpm coverage 60 --pack path/to/pack.json
 */
import { readFileSync } from 'node:fs'
import { nexoraContentRaw } from '../../src/content/nexora'

export interface Pack {
  name: string
  raw: unknown
}

/** `--pack <file>` if given, and the arguments with it removed. */
export function packArgument(argv: string[]): { path?: string; rest: string[] } {
  const at = argv.indexOf('--pack')
  if (at === -1) return { rest: argv }
  const path = argv[at + 1]
  if (!path) throw new Error('--pack needs a path to a pack JSON file')
  return { path, rest: [...argv.slice(0, at), ...argv.slice(at + 2)] }
}

export function loadPack(path?: string): Pack {
  if (!path) return { name: 'nexora (built in)', raw: nexoraContentRaw }
  return { name: path, raw: JSON.parse(readFileSync(path, 'utf8')) as unknown }
}
