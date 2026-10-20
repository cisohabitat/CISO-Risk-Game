/**
 * `pnpm tsx scripts/playtest-driver.ts <port> <width>x<height> <dist> <outdir> [save.json]`
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
 *
 * A save written by `scripts/prepare-campaign.ts` can be given as the last
 * argument. It is put in the browser's save store before the agent starts, as
 * the end-to-end suite does, so a playtester can begin from a point months in
 * — a year's end, to play the second year — and open it from the start screen.
 */
import { mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { playtestControl, playtestSite } from './playtest-http.ts'
import { chromium } from '@playwright/test'

const [portArg = '4301', size = '1440x900', dist = 'dist', outdir = '/tmp/playtest', saveFile] = process.argv.slice(2)
const port = Number(portArg)
const [width, height] = size.split('x').map(Number) as [number, number]
const sitePort = port + 1000

// Both services are local-only; the command service also rejects foreign origins.
playtestSite(dist).listen(sitePort, '127.0.0.1')
await mkdir(outdir, { recursive: true })

// The same browser the end-to-end suite uses where one is installed.
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium'
const browser = await chromium.launch(existsSync(LOCAL_CHROMIUM) ? { executablePath: LOCAL_CHROMIUM, args: ['--no-sandbox'] } : {})
const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true })
const page = await context.newPage()
let shots = 0

if (saveFile) {
  const record: unknown = JSON.parse(await readFile(saveFile, 'utf8'))
  await page.goto(`http://localhost:${sitePort}/`)
  await page.getByRole('heading', { name: 'CISO: First Year' }).waitFor()
  await page.evaluate(async (save) => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const open = indexedDB.open('ciso-first-year')
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite')
      tx.objectStore('saves').put(save)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  }, record)
}

type Command = { do: string; [key: string]: unknown }

async function run(command: Command): Promise<unknown> {
  const locate = () => {
    const role = command.role as Parameters<typeof page.getByRole>[0]
    const base = page.getByRole(role, { name: command.name as string, exact: Boolean(command.exact) })
    return base.filter({ visible: true }).nth(Number(command.nth ?? 0))
  }
  switch (command.do) {
    case 'goto': {
      const base = `http://localhost:${sitePort}`
      const url = new URL(String(command.url), base)
      if (url.origin !== base) throw new Error('Navigation must stay on the local game.')
      await page.goto(url.href)
      await page.waitForLoadState('networkidle')
      return { url: page.url() }
    }
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
      const name = basename(file.suggestedFilename().replace(/\\/g, '/'))
      const path = join(outdir, name === '.' || name === '..' ? 'download.json' : name)
      await file.saveAs(path)
      return { path }
    }
    default:
      throw new Error(`unknown command: ${command.do}`)
  }
}

playtestControl(run).listen(port, '127.0.0.1', () => console.log(`playtest driver on ${port}, game on ${sitePort}, ${width}x${height}`))
