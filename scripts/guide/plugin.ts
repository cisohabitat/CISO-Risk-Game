/**
 * Builds the player's guide into the site as `guide.html`, which the host
 * serves at `/guide` (docs/HOSTING.md). Its pictures are emitted as hashed
 * assets beside the game's own, so they are cached like them and cannot go
 * stale behind a changed screenshot.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import type { Plugin } from 'vite'
import { GUIDE_META, renderGuidePage, type PageMeta } from './page.ts'

export const GUIDE_SOURCE = 'docs/PLAYER_GUIDE.md'

/**
 * Every page built from the docs, served at its name without `.html`
 * (`cleanUrls`). The guide, and the release pages of Phase 7 of
 * docs/ROADMAP.md: what the game is, for press and for anyone sent a link,
 * and what has been checked for access.
 */
export const PAGES: { source: string; out: string; meta: PageMeta }[] = [
  { source: GUIDE_SOURCE, out: 'guide.html', meta: GUIDE_META },
  {
    source: 'docs/release/ABOUT.md',
    out: 'about.html',
    meta: {
      label: 'About',
      description: 'CISO: First Year is a single-player strategy game about the judgement of a security leader, played in the browser over one simulated year.',
      contents: false,
    },
  },
  {
    source: 'docs/release/ACCESSIBILITY.md',
    out: 'accessibility.html',
    meta: { label: 'Accessibility', description: 'What has been checked for access in CISO: First Year, how, and what has not.', contents: false },
  },
]

export function guidePage(root: string = process.cwd()): Plugin {
  return {
    name: 'player-guide',
    apply: 'build',
    async generateBundle() {
      const urls = new Map<string, string>()
      for (const page of PAGES) {
        const source = join(root, page.source)
        const markdown = await readFile(source, 'utf8')
        for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
          const src = match[1]!
          const path = join(dirname(source), src)
          if (urls.has(path)) continue
          const ref = this.emitFile({ type: 'asset', name: `guide-${basename(src)}`, source: await readFile(path) })
          urls.set(path, `/${this.getFileName(ref)}`)
        }
        this.emitFile({
          type: 'asset',
          fileName: page.out,
          source: renderGuidePage(markdown, (src) => urls.get(join(dirname(source), src)) ?? src, page.meta),
        })
      }
    },
  }
}
