/**
 * `pnpm tsx scripts/playtest-driver.ts <port> <width>x<height> <dist> <outdir>`
 *
 * A browser an AI playtester can play turn by turn (docs/PLAYTEST.md, "AI
 * playtests"). It serves a built copy of the game itself (clean URLs, like
 * the host) and keeps one browser page open, driven by small JSON commands
 * posted to http://localhost:<port>/:
 *
 *   {"do":"goto","url":"/?playtest&seed=x"}
 *   {"do":"read"}                      the page as its accessibility tree
 *   {"do":"shot"}                      a screenshot; returns its path
 *   {"do":"click","role":"button","name":"Decide","nth":0,"exact":false}
 *   {"do":"clickText","text":"Start with the business services"}
 *   {"do":"check","role":"radio","name":"…"}
 *   {"do":"fill","label":"Campaign seed","value":"…"}
 *   {"do":"press","key":"Tab"}         keyboard, as a keyboard-only player would
 *   {"do":"focused"}                   what has focus, by role and name
 *   {"do":"scroll","dy":600}
 *   {"do":"wait","ms":1500}
 *   {"do":"download","role":"button","name":"Stop and export"}  click, save the file, return its path
 *
 * It plays the interface only: there is no command to read game state, so a
 * playtester knows what a player would know.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { chromium } from '@playwright/test'

const [portArg = '4301', size = '1440x900', dist = 'dist', outdir = '/tmp/playtest'] = process.argv.slice(2)
const port = Number(portArg)
const [width, height] = size.split('x').map(Number) as [number, number]
const sitePort = port + 1000

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
}

// The game, served as the host serves it.
createServer(async (request, response) => {
  const path = decodeURIComponent((request.url ?? '/').split('?')[0]!)
  const candidates = [path, `${path}.html`, '/index.html'].map((p) => join(dist, p === '/' ? '/index.html' : p))
  for (const file of candidates) {
    try {
      if (!(await stat(file)).isFile()) continue
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
      response.end(await readFile(file))
      return
    } catch {
      /* next */
    }
  }
  response.writeHead(404).end()
}).listen(sitePort)

// The same browser the end-to-end suite uses where one is installed.
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium'
const browser = await chromium.launch(existsSync(LOCAL_CHROMIUM) ? { executablePath: LOCAL_CHROMIUM, args: ['--no-sandbox'] } : {})
const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true })
const page = await context.newPage()
let shots = 0

type Command = { do: string; [key: string]: unknown }

async function run(command: Command): Promise<unknown> {
  const locate = () => {
    const role = command.role as Parameters<typeof page.getByRole>[0]
    const base = page.getByRole(role, { name: command.name as string, exact: Boolean(command.exact) })
    return base.filter({ visible: true }).nth(Number(command.nth ?? 0))
  }
  switch (command.do) {
    case 'goto':
      await page.goto(`http://localhost:${sitePort}${command.url as string}`)
      await page.waitForLoadState('networkidle')
      return { url: page.url() }
    case 'read':
      return { url: page.url(), tree: await page.locator('body').ariaSnapshot() }
    case 'shot': {
      shots += 1
      const path = `${outdir}/shot-${String(shots).padStart(3, '0')}.png`
      await page.screenshot({ path, fullPage: Boolean(command.full) })
      return { path }
    }
    case 'click':
      await locate().click({ timeout: 8000 })
      await page.waitForTimeout(400)
      return { ok: true }
    case 'clickText':
      await page.getByText(command.text as string, { exact: Boolean(command.exact) }).filter({ visible: true }).first().click({ timeout: 8000 })
      await page.waitForTimeout(400)
      return { ok: true }
    case 'check':
      await locate().check({ timeout: 8000 })
      return { ok: true }
    case 'fill':
      await page.getByLabel(command.label as string).fill(command.value as string)
      return { ok: true }
    case 'press':
      await page.keyboard.press(command.key as string)
      await page.waitForTimeout(200)
      return { ok: true }
    case 'focused':
      return page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null
        if (!element) return { focused: null }
        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          name: element.getAttribute('aria-label') ?? element.innerText?.slice(0, 120) ?? '',
        }
      })
    case 'scroll':
      await page.mouse.wheel(0, Number(command.dy ?? 600))
      await page.waitForTimeout(300)
      return { ok: true }
    case 'wait':
      await page.waitForTimeout(Number(command.ms ?? 1000))
      return { ok: true }
    case 'download': {
      const download = page.waitForEvent('download')
      await locate().click({ timeout: 8000 })
      const file = await download
      const path = `${outdir}/${file.suggestedFilename()}`
      await file.saveAs(path)
      return { path }
    }
    default:
      throw new Error(`unknown command: ${command.do}`)
  }
}

createServer((request, response) => {
  let body = ''
  request.on('data', (chunk: Buffer) => (body += chunk.toString()))
  request.on('end', async () => {
    try {
      const result = await run(JSON.parse(body) as Command)
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result))
    } catch (error) {
      response.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: String(error).slice(0, 600) }))
    }
  })
}).listen(port, () => console.log(`playtest driver on ${port}, game on ${sitePort}, ${width}x${height}`))
