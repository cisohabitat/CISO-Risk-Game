import { expect, test } from '@playwright/test'
import { beginCampaign, expectNoHorizontalScroll, goTo } from './helpers'
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
    const { width, height } = page.viewportSize()!
    const selected = width < 640 || height >= width ? 'mobile' : 'desktop'
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


test('portrait iPads select the portrait composition and rotation restores landscape artwork', async ({ page }) => {
  for (const portrait of [{ width: 768, height: 1024 }, { width: 834, height: 1112 }, { width: 1024, height: 1366 }]) {
    await page.setViewportSize(portrait)
    await page.goto('/')
    const image = page.locator('.start-scene img')
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.currentSrc)).toContain('start-mobile-')
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0)
    await expect(page.locator('.start-content')).toHaveCSS('align-items', 'center')
    await expect(page.getByRole('heading', { name: 'CISO: First Year', exact: true })).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: 'Begin your first year', exact: true })).toBeInViewport({ ratio: 1 })
    await expectNoHorizontalScroll(page)
    await page.setViewportSize({ width: portrait.height, height: portrait.width })
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.currentSrc)).toContain('start-desktop-')
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0)
    await expect(page.locator('.start-content')).toHaveCSS('align-items', 'flex-start')
    await expect(page.getByRole('button', { name: 'Begin your first year', exact: true })).toBeInViewport({ ratio: 1 })
    await expectNoHorizontalScroll(page)
  }
})


for (const theme of ['light', 'dark'] as const) {
  test(`iPad rotation keeps Continue and a storage warning readable together, ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('ciso-theme', value), theme)
    await openPreparedCampaign(page, prepareCampaign('rotation-resume', 'day:200'))
    await page.getByRole('button', { name: 'Save and close this campaign' }).click()
    const resume = page.getByRole('button', { name: 'Continue campaign', exact: true })
    await expect(resume).toBeVisible()
    // Lose storage after listing the existing save. Rerender through a real
    // options change, retaining that previously listed campaign in memory.
    const storage = await page.evaluateHandle(() => window.indexedDB)
    await page.evaluate(() => Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }))
    await page.getByRole('link', { name: 'Campaign options', exact: true }).click()
    await page.getByRole('radio', { name: /^Guided / }).check()
    for (const portrait of [{ width: 768, height: 1024 }, { width: 834, height: 1112 }, { width: 1024, height: 1366 }]) {
      for (const viewport of [portrait, { width: portrait.height, height: portrait.width }]) {
        await page.setViewportSize(viewport)
        await page.evaluate(() => window.scrollTo(0, 0))
        await expect(page.locator('.start-storage')).toBeInViewport({ ratio: 1 })
        await expect(resume).toBeInViewport({ ratio: 1 })
        await expect(page.getByRole('button', { name: 'Begin your first year', exact: true })).toBeInViewport({ ratio: 1 })
        const scene = viewport.height >= viewport.width ? 'mobile' : 'desktop'
        await expect.poll(() => page.locator('.start-scene img').evaluate((node: HTMLImageElement) => node.currentSrc)).toContain(`start-${scene}-`)
        await expectNoHorizontalScroll(page)
      }
    }
    await page.evaluate((db) => Object.defineProperty(window, 'indexedDB', { value: db, configurable: true }), storage)
    await resume.click()
    await expect(page.getByRole('main', { name: 'Briefing', exact: true })).toBeVisible()
    await goTo(page, 'Your year')
    await expect(page.getByRole('main', { name: 'Your year', exact: true })).toContainText('seed rotation-resume')
  })
}

test('Inbox is deferred until play and a failed chunk leaves the briefing reachable', async ({ page }) => {
  const inboxRequests: string[] = []
  page.on('request', (request) => { if (/InboxScreen-.*\.js/.test(request.url())) inboxRequests.push(request.url()) })
  await page.route('**/InboxScreen-*.js', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year', exact: true })).toBeVisible()
  expect(inboxRequests).toHaveLength(0)
  await beginCampaign(page, 'inbox-load-failure')
  await goTo(page, 'Inbox')
  await page.getByRole('button', { name: 'Back to the briefing', exact: true }).click()
  await expect(page.getByRole('main', { name: 'Briefing', exact: true })).toBeVisible()
  expect(inboxRequests.length).toBeGreaterThan(0)
})
