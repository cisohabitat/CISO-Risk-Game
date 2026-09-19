import { test } from '@playwright/test'
import { goTo, startCampaign } from './helpers'

/**
 * Not an assertion suite: captures the screens so the visual language can be
 * reviewed. Run with `pnpm exec playwright test screenshots --project=...`.
 */
test.describe('screenshots', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium only')

  test('capture the main screens', async ({ page }, testInfo) => {
    await startCampaign(page, 'gallery')
    const shot = async (name: string) => {
      await page.screenshot({ path: `screenshots/${testInfo.project.name}-${name}.png`, fullPage: false })
    }
    await shot('01-briefing')
    await page.getByRole('button', { name: 'Decide' }).first().click()
    await page.getByRole('dialog').waitFor()
    await page.waitForTimeout(400)
    await shot('02-decision')
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    for (const [index, screen] of ['Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board'].entries()) {
      await goTo(page, screen)
      if (screen === 'Organisation') {
        await page.getByText('Nexora Pay').first().waitFor({ timeout: 20_000 }).catch(() => {})
      }
      await shot(`0${index + 3}-${screen.toLowerCase()}`)
    }

    // The dark theme is the primary visual treatment; capture it too.
    await goTo(page, 'Briefing')
    await page.getByRole('button', { name: /Switch to dark mode/ }).click()
    await page.waitForTimeout(300)
    await shot('09-briefing-dark')
    await goTo(page, 'Risk')
    await shot('10-risk-dark')
  })
})
