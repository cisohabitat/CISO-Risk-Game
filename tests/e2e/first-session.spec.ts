import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, startCampaign } from './helpers'

/**
 * Phase 1 of docs/ROADMAP.md: the first session on a phone, held to the same
 * standard as the desktop. Photographed at 320px, the header had wrapped to
 * three rows — the date, the clock, then save, leave and theme on a row of
 * their own — and took a quarter of the screen before the briefing began.
 */
test('the header takes two rows at most on a phone, and the briefing starts beneath it', async ({ page }) => {
  await startCampaign(page, 'e2e-first-session')
  const width = page.viewportSize()?.width ?? 1280
  const header = page.locator('header').first()
  const tools = page.getByTestId('header-tools')
  const clock = page.getByTestId('header-clock')
  await expect(tools).toBeVisible()

  const [headerBox, toolsBox, clockBox] = await Promise.all([header.boundingBox(), tools.boundingBox(), clock.boundingBox()])
  if (width < 640) {
    // Save, leave and theme share the date's row; the clock has the next.
    expect(toolsBox!.y + toolsBox!.height).toBeLessThanOrEqual(clockBox!.y + 1)
    // Measured: 162px in three rows before, 121px in two after.
    expect(headerBox!.height, `header is ${headerBox!.height}px tall at ${width}px`).toBeLessThanOrEqual(125)
  } else {
    expect(headerBox!.height).toBeLessThanOrEqual(80)
  }
  await expectNoHorizontalScroll(page)

  // The first thing the briefing asks for is in reach without hunting.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Decide' }).first().scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Decide' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Commit to this' })).toBeInViewport()
  await expectNoHorizontalScroll(page)
})
