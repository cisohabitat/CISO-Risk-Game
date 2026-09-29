/**
 * Builds the player's guide into the site as `guide.html`, which the host
 * serves at `/guide` (docs/HOSTING.md). Its pictures are emitted as hashed
 * assets beside the game's own, so they are cached like them and cannot go
 * stale behind a changed screenshot.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import type { Plugin } from 'vite'
import { renderGuidePage } from './page.ts'

export const GUIDE_SOURCE = 'docs/PLAYER_GUIDE.md'

export function guidePage(root: string = process.cwd()): Plugin {
  return {
    name: 'player-guide',
    apply: 'build',
    async generateBundle() {
      const source = join(root, GUIDE_SOURCE)
      const markdown = await readFile(source, 'utf8')
      const urls = new Map<string, string>()
      for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const src = match[1]!
        if (urls.has(src)) continue
        const ref = this.emitFile({
          type: 'asset',
          name: `guide-${basename(src)}`,
          source: await readFile(join(dirname(source), src)),
        })
        urls.set(src, `/${this.getFileName(ref)}`)
      }
      this.emitFile({
        type: 'asset',
        fileName: 'guide.html',
        source: renderGuidePage(markdown, (src) => urls.get(src) ?? src),
      })
    },
  }
}
