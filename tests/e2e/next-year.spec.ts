import { expect, test } from '@playwright/test'
import { goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign, SAVE_ROW } from './prepared'

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

  await page.getByRole('button', { name: 'Begin your second year' }).click()
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
