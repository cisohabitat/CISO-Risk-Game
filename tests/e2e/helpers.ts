import { expect, type Page } from '@playwright/test'

export async function startCampaign(page: Page, seed = 'e2e-seed'): Promise<void> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
  const seedField = page.getByLabel('Campaign seed')
  await seedField.fill(seed)
  await page.getByRole('button', { name: 'Begin your first day' }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible({ timeout: 20_000 })
}

/** Navigate by the visible affordance for this viewport, never by URL. */
export async function goTo(page: Page, label: string): Promise<void> {
  const nav = page.getByRole('navigation', { name: 'Primary' })
  const direct = nav.getByRole('button', { name: label, exact: true })
  if (await direct.first().isVisible().catch(() => false)) {
    await direct.first().click()
    return
  }
  // Secondary destinations live behind "More" on small screens.
  await nav.getByRole('button', { name: 'More' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: label, exact: true }).first().click()
  await expect(dialog).toBeHidden()
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - doc.clientWidth
  })
  expect(overflow, 'page-level horizontal scrolling appeared').toBeLessThanOrEqual(1)
}
