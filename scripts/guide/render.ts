/**
 * The player's guide, from `docs/PLAYER_GUIDE.md` to a page the site serves.
 *
 * A renderer for the Markdown the guide actually uses — headings, paragraphs,
 * lists, tables, images, rules, emphasis, code and links — and nothing more,
 * so the page needs no dependency and no script. The guide is written for a
 * reader rather than a renderer; a construct it does not know is left as text,
 * and the guide test fails if Markdown syntax survives into the page.
 */

export interface GuideHeading {
  id: string
  text: string
}

export interface RenderedGuide {
  title: string
  /** The body, without the title. */
  html: string
  /** Second-level headings, for the contents. */
  sections: GuideHeading[]
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** A private-use character, never in the guide: marks text held aside. */
const HELD = '\uE000'

/** Emphasis, code and links inside one line of text. */
export function renderInline(text: string): string {
  // Code first, held aside so nothing inside it is read as emphasis.
  const held: string[] = []
  const hold = (html: string) => `${HELD}${held.push(html) - 1}${HELD}`
  let out = text.replace(/`([^`]+)`/g, (_, code: string) => hold(`<code>${escapeHtml(code)}</code>`))
  out = out.replace(/<(https?:\/\/[^>\s]+)>/g, (_, url: string) => hold(`<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`))
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, url: string) =>
    hold(`<a href="${escapeHtml(url)}">${renderInline(label)}</a>`),
  )
  out = escapeHtml(out)
  out = out.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>')
  return out.replace(new RegExp(`${HELD}(\\d+)${HELD}`, 'g'), (_, n: string) => held[Number(n)]!)
}

const LIST_ITEM = /^(\s*)(?:-|\d+\.)\s+(.*)$/
const IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/

function splitRow(line: string): string[] {
  const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
  return cells.map((cell) => cell.trim())
}

/**
 * The guide as HTML. `imageUrl` maps a path the Markdown uses to the URL the
 * page will serve it from.
 */
export function renderGuide(markdown: string, imageUrl: (src: string) => string = (src) => src): RenderedGuide {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  const sections: GuideHeading[] = []
  let title = ''
  let i = 0

  const isBlockStart = (line: string) =>
    /^#{1,6}\s/.test(line) || /^---+\s*$/.test(line) || line.startsWith('|') || IMAGE.test(line.trim()) || LIST_ITEM.test(line)

  while (i < lines.length) {
    const line = lines[i]!
    if (line.trim() === '') {
      i += 1
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1]!.length
      const html = renderInline(heading[2]!)
      if (level === 1 && !title) {
        title = heading[2]!
      } else {
        const id = slug(html)
        if (level === 2) sections.push({ id, text: html.replace(/<[^>]+>/g, '') })
        out.push(`<h${level} id="${id}">${html}</h${level}>`)
      }
      i += 1
      continue
    }

    if (/^---+\s*$/.test(line)) {
      out.push('<hr>')
      i += 1
      continue
    }

    const image = IMAGE.exec(line.trim())
    if (image) {
      const alt = escapeHtml(image[1]!)
      out.push(`<figure><img src="${escapeHtml(imageUrl(image[2]!))}" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`)
      i += 1
      continue
    }

    if (line.startsWith('|')) {
      const rows: string[] = []
      while (i < lines.length && lines[i]!.startsWith('|')) rows.push(lines[i++]!)
      const [head, rule, ...body] = rows
      const hasHead = rule !== undefined && /^\|?\s*:?-{3,}/.test(rule)
      const table: string[] = ['<div class="table"><table>']
      if (hasHead) {
        table.push(`<thead><tr>${splitRow(head!).map((cell) => `<th>${renderInline(cell)}</th>`).join('')}</tr></thead>`)
      }
      const bodyRows = hasHead ? body : rows
      table.push('<tbody>')
      for (const row of bodyRows) {
        const cells = splitRow(row)
        table.push(`<tr>${cells.map((cell, n) => (n === 0 ? `<th scope="row">${renderInline(cell)}</th>` : `<td>${renderInline(cell)}</td>`)).join('')}</tr>`)
      }
      table.push('</tbody></table></div>')
      out.push(table.join(''))
      continue
    }

    const first = LIST_ITEM.exec(line)
    if (first) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length) {
        const current = lines[i]!
        const item = LIST_ITEM.exec(current)
        if (item && item[1]!.length === 0) {
          items.push(item[2]!)
        } else if (current.trim() !== '' && /^\s+/.test(current) && items.length > 0) {
          // A continuation, indented under the item it belongs to.
          items[items.length - 1] += ` ${current.trim()}`
        } else {
          break
        }
        i += 1
      }
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</${tag}>`)
      continue
    }

    const paragraph: string[] = []
    while (i < lines.length && lines[i]!.trim() !== '' && (paragraph.length === 0 || !isBlockStart(lines[i]!))) {
      paragraph.push(lines[i]!.trim())
      i += 1
    }
    out.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
  }

  return { title, html: out.join('\n'), sections }
}
