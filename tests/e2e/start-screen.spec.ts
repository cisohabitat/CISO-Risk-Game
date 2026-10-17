import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

for (const theme of ['light', 'dark'] as const) {
  test(`illustrated title starts immediately and requests only its responsive scene, ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('ciso-theme', value), theme)
    const scenes: string[] = []
    page.on('request', (request) => {
      if (/start-(desktop|mobile)-.*\.webp/.test(request.url())) scenes.push(request.url())
    })
    await page.goto('/')
    const image = page.locator('.start-scene img')
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
    const selected = page.viewportSize()!.width < 640 ? 'mobile' : 'desktop'
    expect(scenes).toHaveLength(1)
    expect(scenes[0]).toContain(`start-${selected}-`)
    const begin = page.getByRole('button', { name: 'Begin your first year', exact: true })
    await expect(begin).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: 'Continue campaign', exact: true })).toHaveCount(0)
    await expectNoHorizontalScroll(page)
    await begin.click()
    await expect(page.getByRole('main', { name: 'Briefing', exact: true })).toBeVisible()
  })
}

test('the title resumes the latest campaign and leaves campaign options reachable', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('title-continue', 'day:200'))
  await page.getByRole('button', { name: 'Save and close this campaign' }).click()
  const resume = page.getByRole('button', { name: 'Continue campaign', exact: true })
  await expect(resume).toBeVisible()
  await expect(resume).toBeInViewport({ ratio: 1 })
  if (page.viewportSize()!.width >= 1024) {
    await page.setViewportSize({ width: 1366, height: 480 })
    await expect(resume).toBeInViewport({ ratio: 1 })
  }
  await expect(page.getByText('Latest save · 20 July · title-continue')).toBeVisible()
  await page.getByRole('link', { name: 'Campaign options', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Start a new year', exact: true })).toBeInViewport()
  await expect(page.getByRole('radio', { name: /^CISO The intended/ })).toBeChecked()
  await resume.click()
  await expect(page.getByRole('main', { name: 'Briefing', exact: true })).toBeVisible()
  await goTo(page, 'Your year')
  await expect(page.getByRole('main', { name: 'Your year', exact: true })).toContainText('seed title-continue')
})

test('the title remains usable when artwork and storage are unavailable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { value: undefined }))
  await page.route('**/start-*.webp', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year', exact: true })).toBeVisible()
  await expect(page.locator('.start-storage')).toContainText('Saving is unavailable')
  await page.getByRole('button', { name: 'Begin your first year', exact: true }).click()
  await expect(page.getByRole('main', { name: 'Briefing', exact: true })).toBeVisible()
})
