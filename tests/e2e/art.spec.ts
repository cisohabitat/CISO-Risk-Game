import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, goTo, startCampaign } from './helpers'

test('portraits load with people rather than with the start screen', async ({ page }) => {
  const portraits: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('nexora-people')) portraits.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
  expect(portraits).toHaveLength(0)

  await startCampaign(page, 'e2e-art')
  await goTo(page, 'Board')
  const executive = page.getByRole('heading', { name: 'Marianne Okafor', exact: true }).locator('..').locator('..')
  const portrait = executive.locator('img')
  await portrait.scrollIntoViewIfNeeded()
  await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await expectNoHorizontalScroll(page)

  await goTo(page, 'Team')
  const leader = page.getByRole('heading', { name: 'Jo Mbeki', exact: true }).locator('..').locator('..').locator('img')
  await leader.scrollIntoViewIfNeeded()
  await expect.poll(() => leader.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  // Every portrait uses the same cached atlas, including when changing screens.
  expect(new Set(portraits).size).toBe(1)
  await expectNoHorizontalScroll(page)
})
