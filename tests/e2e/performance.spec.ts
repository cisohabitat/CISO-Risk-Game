import { expect, test } from '@playwright/test'
import { startCampaign } from './helpers'

/**
 * Phase 5 of docs/ROADMAP.md: fast on a cheap phone, measured in CI. The CPU
 * is slowed four times to stand in for one. Measured on 9 October 2026 at that
 * rate: the start screen ready in about 650ms from the local server, and a
 * thirty-day skip ahead drawn in 80–520ms (median about 150). The limits are
 * about four times that. The network is not throttled here — the local
 * server does not compress, so it would overstate what a player downloads;
 * `pnpm size` and the Slow 3G figures in docs/FINDINGS.md cover that.
 */
test('the game stays responsive on a slow processor', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CPU throttling is a Chromium feature')
  test.setTimeout(120_000)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const started = Date.now()
  await page.goto('/')
  await page.getByRole('button', { name: 'Begin your first day' }).waitFor()
  expect(Date.now() - started, 'start screen ready').toBeLessThan(3000)

  await startCampaign(page, 'e2e-performance')
  const skips: number[] = []
  for (let n = 0; n < 6; n += 1) {
    skips.push(
      await page.evaluate(async () => {
        const button = Array.from(document.querySelectorAll('button')).find((element) => element.textContent?.trim() === 'Skip ahead')!
        const start = performance.now()
        button.click()
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        return performance.now() - start
      }),
    )
    if (await page.getByRole('dialog').isVisible().catch(() => false)) await page.keyboard.press('Escape')
  }
  skips.sort((a, b) => a - b)
  const median = skips[Math.floor(skips.length / 2)]!
  expect(median, `skip ahead: ${skips.map(Math.round).join(', ')}ms`).toBeLessThan(600)
  expect(Math.max(...skips), `skip ahead: ${skips.map(Math.round).join(', ')}ms`).toBeLessThan(2000)
})
