import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Phase 7 of docs/ROADMAP.md: what the game is, for press and for anyone sent
 * a link, and what has been checked for access — built from docs/release/
 * beside the guide, and linked from the start screen's foot.
 */
for (const page of [
  { path: '/about', heading: 'CISO: First Year', images: 5 },
  { path: '/accessibility', heading: 'Accessibility statement', images: 0 },
]) {
  test(`${page.path} is a page of its own that works and passes the access checks`, async ({ page: browser }) => {
    const errors: string[] = []
    browser.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await browser.goto(page.path)
    await expect(browser.getByRole('heading', { level: 1, name: page.heading })).toBeVisible()
    await expect(browser.getByRole('link', { name: /Back to the game/ }).first()).toHaveAttribute('href', '/')

    const images = browser.locator('main img')
    expect(await images.count()).toBe(page.images)
    for (const src of await images.evaluateAll((all) => all.map((image) => (image as HTMLImageElement).getAttribute('src')!))) {
      expect((await browser.request.get(src)).ok(), src).toBe(true)
    }

    // Every link to the site goes somewhere real, anchors included.
    const hrefs = await browser.locator('main a[href^="/"]').evaluateAll((all) => all.map((link) => link.getAttribute('href')!))
    for (const href of hrefs) {
      const [path, anchor] = href.split('#')
      const response = await browser.request.get(path || '/')
      expect(response.ok(), href).toBe(true)
      if (anchor) expect(await response.text(), href).toContain(`id="${anchor}"`)
    }

    const overflow = await browser.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    const results = await new AxeBuilder({ page: browser }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([])
    expect(errors).toEqual([])
  })
}

test('the start screen links to both, quietly', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'About this game' })).toHaveAttribute('href', '/about')
  await expect(page.getByRole('link', { name: 'Accessibility' })).toHaveAttribute('href', '/accessibility')
})
