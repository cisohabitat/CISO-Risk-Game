import { expect, test } from '@playwright/test'
import { beginCampaign, expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('portraits load with people rather than with the start screen', async ({ page }) => {
  const portraits: string[] = []
  const fonts: string[] = []
  const incidents: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('nexora-people')) portraits.push(request.url())
    if (request.url().endsWith('.woff2')) fonts.push(request.url())
    if (request.url().includes('nexora-incidents')) incidents.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
  expect(portraits).toHaveLength(0)
  expect(incidents).toHaveLength(0)
  await page.evaluate(() => document.fonts.ready)
  expect(fonts.length).toBeGreaterThan(0)
  for (const font of fonts) expect(new URL(font).origin).toBe(new URL(page.url()).origin)

  await beginCampaign(page, 'e2e-art')
  await goTo(page, 'Board')
  const executive = page.getByRole('heading', { name: 'Marianne Okafor', exact: true }).locator('..').locator('..')
  const portrait = executive.locator('img')
  await portrait.scrollIntoViewIfNeeded()
  expect((await portrait.locator('..').boundingBox())!.width).toBeGreaterThanOrEqual(80)
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

test('an incident illustration loads beside the factual response journal', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('visual-incident', 'incident'))
  const illustration = page.locator('.incident-art img').first()
  await illustration.scrollIntoViewIfNeeded()
  await expect.poll(() => illustration.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await expect(page.getByText('What you have been told', { exact: true })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
