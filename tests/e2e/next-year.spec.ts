import { expect, test } from '@playwright/test'
import { goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign, SAVE_ROW } from './prepared'

test('a next-year loading failure leaves the finished campaign available to export', async ({ page }) => {
  await page.route('**/next-year-*.js', (route) => route.abort())
  await openPreparedCampaign(page, prepareCampaign('next-year-load-failure', 'year-end'))
  await expect(page.getByRole('heading', { name: 'How the year is read' })).toBeVisible()
  await page.getByRole('button', { name: 'Begin your second year' }).click()
  await expect(page.getByText('The next year could not load. Export this campaign before reloading to try again.', { exact: true })).toBeVisible()
  await expect(page.getByTestId('year-over')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export this campaign', exact: true }).click()
  expect((await download).suggestedFilename()).toMatch(/\.json$/)
})

/**
 * A finished year leads to the next one, at the same Nexora: the review offers
 * it, the header says which year it is, the chief executive opens it, and the
 * finished year's save stays where it was.
 */
test('a finished year leads to a second year that remembers it', async ({ page }) => {
  test.setTimeout(120_000)
  await openPreparedCampaign(page, prepareCampaign('e2e-next-year', 'year-end'))
  await goTo(page, 'Your year')
  await expect(page.getByRole('heading', { name: 'How the year is read' })).toBeVisible()
  await expect(page.getByText('Your second year begins where this one ends')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Continue with what you built', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Try a different first year', exact: true })).toBeVisible()

  // Two taps while the next-year builder loads must still create just one year.
  await page.getByRole('button', { name: 'Begin your second year' }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
  const header = page.locator('header[data-print="hide"]')
  await expect(header).toContainText('Second year')
  await expect(header).toContainText('January')

  await goTo(page, 'Inbox')
  await expect(page.getByText('A year in').first()).toBeVisible()
  await expect(page.getByText('The CEO meeting starts in 23 minutes')).toHaveCount(0)

  // Both years are kept: the finished one, and the one under way.
  await page.reload()
  const rows = page.getByRole('button', { name: SAVE_ROW })
  await expect(rows).toHaveCount(2)
  await expect(rows.filter({ hasText: 'second year' })).toHaveCount(1)
})
