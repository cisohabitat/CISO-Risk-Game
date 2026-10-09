import { expect, test } from '@playwright/test'
import { goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

/**
 * Phase 6 of docs/ROADMAP.md: a finished year can be sent, and what is sent
 * opens the same year for whoever receives it.
 */
test('a finished year is shared as a link that opens the same year', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are a Chromium feature here')
  test.setTimeout(120_000)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  // Headless Chromium on a desktop has no share sheet; the clipboard is the path.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
  })
  await openPreparedCampaign(page, prepareCampaign('e2e-share', 'year-end', 'high-pressure'))
  await goTo(page, 'Your year')
  await expect(page.getByRole('heading', { name: 'How the year is read' })).toBeVisible()

  await page.getByRole('button', { name: 'Share this year' }).click()
  await expect(page.getByTestId('toasts')).toContainText('Your year is copied')
  const text = await page.evaluate(() => navigator.clipboard.readText())
  expect(text).toContain('My first year as CISO of Nexora Group (High pressure')
  expect(text).toMatch(/Resilience: (weak|developing|solid|strong)/)
  const url = /Play the same year: (\S+)/.exec(text)?.[1]
  expect(url).toMatch(/\/\?seed=e2e-share&mode=high-pressure/)

  // Whoever opens it starts on the same seed and mode, and is told so.
  await page.evaluate(() => localStorage.clear())
  await page.goto(url!)
  await expect(page.getByTestId('shared-year')).toContainText('e2e-share')
  await expect(page.getByLabel('Campaign seed')).toHaveValue('e2e-share')
  await expect(page.getByRole('radio', { name: /High pressure/ })).toBeChecked()
})
