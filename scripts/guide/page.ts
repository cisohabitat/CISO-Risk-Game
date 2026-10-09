/**
 * The guide as a page of its own, served beside the game at `/guide`.
 *
 * It is plain HTML with its styles inline and no script, so it adds nothing to
 * what the game downloads and nothing the site's content security policy has
 * to allow. It opens from a quiet link on the start screen and in the help
 * area, never ahead of the game: whether the game teaches itself is still the
 * question a playtest asks (docs/PLAYTEST.md), and a manual in the way of the
 * first morning would answer it for them.
 */
import { renderGuide } from './render.ts'

const STYLES = `
:root {
  color-scheme: light dark;
  --bg: #f7f5f0; --surface: #ffffff; --ink: #1d2126; --muted: #4f5761; --faint: #5b6370;
  --line: #d9d4ca; --accent: #1f5f8b; --code: #efece5;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14171b; --surface: #1c2025; --ink: #e8e6e1; --muted: #b3b8bf; --faint: #9aa1aa;
    --line: #333a42; --accent: #7fb4dc; --code: #262b31;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 17px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
a { color: var(--accent); }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
.bar {
  position: sticky; top: 0; z-index: 1; background: var(--bg); border-bottom: 1px solid var(--line);
  padding: 10px 16px;
}
.bar div { max-width: 46rem; margin: 0 auto; display: flex; justify-content: space-between; gap: 12px; font-size: 15px; }
.bar a { text-decoration: none; font-weight: 600; }
main { max-width: 46rem; margin: 0 auto; padding: 24px 16px 64px; }
h1, h2, h3 { line-height: 1.25; text-wrap: balance; font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif; }
h1 { font-size: 2.1rem; margin: 8px 0 12px; }
h2 { font-size: 1.5rem; margin: 2.4em 0 0.6em; scroll-margin-top: 64px; }
h3 { font-size: 1.2rem; margin: 1.8em 0 0.5em; scroll-margin-top: 64px; }
p, li { text-wrap: pretty; }
nav.contents { border: 1px solid var(--line); border-radius: 10px; background: var(--surface); padding: 12px 16px; margin: 24px 0; }
nav.contents h2 { font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); margin: 0 0 8px; font-family: inherit; }
nav.contents ol { margin: 0; padding-left: 1.2em; columns: 2 16rem; column-gap: 24px; }
nav.contents li { break-inside: avoid; margin: 2px 0; }
hr { border: 0; border-top: 1px solid var(--line); margin: 2.4em 0; }
code { font: 0.9em ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: var(--code); padding: 0.1em 0.35em; border-radius: 4px; }
figure { margin: 1.4em 0; }
figure img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
figcaption { font-size: 14px; color: var(--faint); margin-top: 6px; }
.table { overflow-x: auto; margin: 1.2em 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
table { border-collapse: collapse; width: 100%; font-size: 15px; }
th, td { text-align: left; vertical-align: top; padding: 8px 12px; border-top: 1px solid var(--line); }
thead th { border-top: 0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--faint); }
tbody th { font-weight: 600; white-space: nowrap; }
ul, ol { padding-left: 1.3em; }
li { margin: 0.35em 0; }
footer { max-width: 46rem; margin: 0 auto; padding: 0 16px 48px; color: var(--faint); font-size: 14px; }
@media (max-width: 480px) {
  body { font-size: 16px; }
  h1 { font-size: 1.7rem; }
  tbody th { white-space: normal; }
}
`

/** What a published page is called, and whether it lists its sections. */
export interface PageMeta {
  label: string
  description: string
  contents: boolean
}

export const GUIDE_META: PageMeta = {
  label: "Player's guide",
  description: 'How to play CISO: First Year: the screens, the two scarce resources, and what a sane first year looks like.',
  contents: true,
}

export function renderGuidePage(markdown: string, imageUrl?: (src: string) => string, meta: PageMeta = GUIDE_META): string {
  const guide = renderGuide(markdown, imageUrl)
  const title = guide.title.replace(/<[^>]+>/g, '')
  const contents = meta.contents
    ? `<nav class="contents" aria-labelledby="contents-title"><h2 id="contents-title">Contents</h2><ol>${guide.sections
        .map((section) => `<li><a href="#${section.id}">${section.text}</a></li>`)
        .join('')}</ol></nav>`
    : ''
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.label} · CISO: First Year</title>
<meta name="description" content="${meta.description}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${STYLES}</style>
</head>
<body>
<header class="bar"><div><a href="/">← Back to the game</a><span>${meta.label}</span></div></header>
<main>
<h1>${title}</h1>
${contents}
${guide.html}
</main>
<footer><a href="/">Back to the game</a></footer>
</body>
</html>
`
}
