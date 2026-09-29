/**
 * The player's guide is published beside the game, so what it says about the
 * game has to stay true of the game.
 *
 * Its pictures are regenerated from the running game (`pnpm guide:shots`); its
 * words were not, and a reread found six places the game had moved on — the
 * board no longer says "bring twenty things", the delegation dialog no longer
 * judges room by workload alone. The guide quotes the interface in bold and in
 * italics. Every quotation of that kind must still be something the game says,
 * or be listed below as plain emphasis.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderGuide, renderInline } from '../../scripts/guide/render.ts'
import { renderGuidePage } from '../../scripts/guide/page.ts'

const root = new URL('../../', import.meta.url).pathname
const markdown = readFileSync(join(root, 'docs/PLAYER_GUIDE.md'), 'utf8')

/** Bold and italic spans that are the guide's own emphasis, not the game's words. */
const EMPHASIS = new Set(
  [
    'deciding what deserves your attention when you cannot possibly cover everything',
    'You cannot fix everything, and the game will not let you try.',
    'is this bad?',
    'is this the thing I spend this week on?',
    'what you are walking into',
    'The masthead and the headline.',
    'The four standing readings',
    'Your resources',
    'The clock',
    'attention',
    'Acting',
    'what each option will visibly cost you',
    'The deadline is real.',
    'Record why.',
    'An option you cannot take says why.',
    'from',
    'Evidence is not risk until you interpret it',
    'residual',
    'confidence',
    'Who you choose matters',
    'drawn with a dashed outline and set back',
    'seen',
    'verified',
    'what the committee sees',
    'surprising the board with something you already knew is the classic failure',
    'containment',
    'recovery',
    'affected services',
    'emerging',
    'Unpatched server',
    'an actor reaches fulfilment through an unpatched server',
    'none of it yet',
    'Two things need your attention.',
    'Moderate',
    'Neutral',
    'Limited',
    'Start with the business services.',
    'Be honest with the CEO',
    'Commission two or three investigations early',
    'Pick one programme and finish it.',
    'Do all three board papers.',
    'Leave something in reserve.',
    'Answering everything and investigating nothing.',
    'Commissioning everything at once.',
    'Treating volume as risk.',
    'Blocking the business on principle.',
    'Ignoring your team.',
    'Screens in this guide are generated from the running game by `pnpm guide:shots` and may differ slightly from your campaign — the organisation\'s hidden configuration varies with the seed.',
  ].map((text) => text.toLowerCase()),
)

function sourceText(): string {
  const parts: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.(tsx?|json)$/.test(entry)) parts.push(readFileSync(path, 'utf8'))
    }
  }
  walk(join(root, 'src'))
  // Text split across JSX lines reads as one sentence on screen.
  return parts.join('\n').replace(/\s+/g, ' ').toLowerCase()
}

/** What the guide sets in bold or italics, one paragraph at a time. */
function quotations(): string[] {
  const out: string[] = []
  const paragraphs = markdown.split(/\n\s*\n/).map((block) => block.replace(/\s*\n\s*/g, ' '))
  for (const paragraph of paragraphs) {
    for (const match of paragraph.matchAll(/\*\*(.+?)\*\*/g)) out.push(match[1]!)
    const withoutBold = paragraph.replace(/\*\*(.+?)\*\*/g, '')
    for (const match of withoutBold.matchAll(/(?:^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g)) out.push(match[1]!)
  }
  return out
}

describe('the player\'s guide', () => {
  it('renders to HTML with no Markdown left over', () => {
    const page = renderGuidePage(markdown)
    const body = page.slice(page.indexOf('<main>'))
    expect(body).not.toMatch(/\*\*|!\[|\]\(|^\||^#{1,6}\s|\uE000/m)
    expect(body).not.toMatch(/`/)
    expect(page).not.toContain('<script')
    const guide = renderGuide(markdown)
    expect(guide.title).toMatch(/player's guide/)
    expect(guide.sections.map((s) => s.text)).toEqual(expect.arrayContaining(['Starting', 'Decisions', 'How the year is judged', 'Keyboard shortcuts']))
    expect(new Set(guide.sections.map((s) => s.id)).size).toBe(guide.sections.length)
  })

  it('renders the constructs it uses the way a reader expects', () => {
    expect(renderInline('**Begin** and *then* `Space` <https://example.org>')).toBe(
      '<strong>Begin</strong> and <em>then</em> <code>Space</code> <a href="https://example.org">https://example.org</a>',
    )
    const { html } = renderGuide('# T\n\n| | What |\n|---|---|\n| **A** | b |\n\n- one\n  two\n- three\n\n1. first\n   more\n\n![Alt](images/x.png)\n\n---\n', (src) => `/assets/${src}`)
    expect(html).toContain('<thead><tr><th></th><th>What</th></tr></thead>')
    expect(html).toContain('<tr><th scope="row"><strong>A</strong></th><td>b</td></tr>')
    expect(html).toContain('<ul><li>one two</li><li>three</li></ul>')
    expect(html).toContain('<ol><li>first more</li></ol>')
    expect(html).toContain('<img src="/assets/images/x.png" alt="Alt"')
    expect(html).toContain('<hr>')
    // Text is escaped, not trusted.
    expect(renderInline('a <b> & "c"')).toBe('a &lt;b&gt; &amp; &quot;c&quot;')
  })

  it('shows only pictures that exist', () => {
    const images = [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((match) => match[1]!)
    expect(images.length).toBeGreaterThan(5)
    for (const image of images) expect(existsSync(join(root, 'docs', image)), image).toBe(true)
  })

  it('quotes only what the game still says', () => {
    const source = sourceText()
    const stale: string[] = []
    for (const quote of quotations()) {
      const text = quote.replace(/^["“]|["”]$/g, '').replace(/<[^>]+>/g, '').trim()
      if (EMPHASIS.has(text.toLowerCase()) || /^https?:/.test(text)) continue
      const bare = text.replace(/[.:]$/, '').toLowerCase()
      if (!source.includes(bare)) stale.push(text)
    }
    expect(stale, `the guide quotes words the game no longer uses:\n${stale.join('\n')}`).toEqual([])
  })
})
