/**
 * `pnpm strings`
 *
 * How much English a translation would have to replace (docs/LOCALISATION.md,
 * Phase 4 of docs/ROADMAP.md): the authored content, the sentences the engine
 * composes, and the words the screens print. A count, not an extraction — it
 * sizes the job and shows where the words live.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { collectLines } from './content/voice.ts'
import { nexoraContentRaw } from '../src/content/nexora'

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path, ext) : ext.test(name) ? [path] : []
  })
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length

/** Quoted or templated literals with at least two words: prose, not ids or classes. */
function proseLiterals(source: string): string[] {
  const found: string[] = []
  for (const match of source.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    const text = match[2]!.replace(/\$\{[^}]*\}/g, 'X')
    if (!/[a-z]{2,} [a-z]{2,}/i.test(text)) continue
    // Tailwind classes, paths and selectors are not prose.
    if (/^[\w:/[\]().%#=&>-]+( [\w:/[\]().%#=&>-]+)*$/.test(text) && /[-:]/.test(text)) continue
    found.push(text)
  }
  return found
}

/** Text between JSX tags. */
function jsxText(source: string): string[] {
  return [...source.matchAll(/>\s*([A-Z][^<>{}\n]*[a-z.?!][^<>{}\n]*)\s*</g)].map((match) => match[1]!.trim())
}

function tally(label: string, dir: string, ext: RegExp, extract: (source: string) => string[]) {
  const rows = files(dir, ext)
    .filter((path) => !/\.test\./.test(path))
    .map((path) => {
      const found = extract(readFileSync(path, 'utf8'))
      return { path: relative(process.cwd(), path), strings: found.length, words: found.reduce((sum, text) => sum + words(text), 0) }
    })
    .filter((row) => row.strings > 0)
    .sort((a, b) => b.words - a.words)
  const strings = rows.reduce((sum, row) => sum + row.strings, 0)
  const total = rows.reduce((sum, row) => sum + row.words, 0)
  console.log(`\n${label}: ${strings} strings, ${total} words, in ${rows.length} files`)
  for (const row of rows.slice(0, 8)) console.log(`  ${String(row.words).padStart(6)} words  ${row.path}`)
  return { strings, words: total }
}

const content = collectLines(nexoraContentRaw).lines
const contentWords = content.reduce((sum, line) => sum + words(line.text), 0)
console.log(`Authored content (src/content/nexora): ${content.length} strings, ${contentWords} words`)
const engine = tally('Composed by the engine (src/game)', 'src/game', /\.ts$/, proseLiterals)
const screens = tally('Printed by the screens (src/components, src/screens, src/app)', 'src', /\.tsx$/, (source) => [...jsxText(source), ...proseLiterals(source)])
const total = contentWords + engine.words + screens.words
console.log(`\nAbout ${total.toLocaleString('en-GB')} words to translate, ${Math.round((contentWords / total) * 100)}% of them content.`)
