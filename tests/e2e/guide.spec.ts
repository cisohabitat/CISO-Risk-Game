import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { startCampaign } from './helpers'

/**
 * The player's guide is served beside the game at /guide, built from
 * docs/PLAYER_GUIDE.md. It is linked quietly from the start screen and the help
 * area and opens in its own tab, so a campaign in progress is never left.
 */
test.describe("the player's guide", () => {
  test('is a page of its own, with its pictures, that fits the screen', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto('/guide')
    await expect(page.getByRole('heading', { level: 1, name: /player's guide/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Back to the game/ }).first()).toHaveAttribute('href', '/')

    // Every picture resolves to a real file.
    const images = page.locator('main img')
    expect(await images.count()).toBeGreaterThan(5)
    for (const src of await images.evaluateAll((all) => all.map((image) => (image as HTMLImageElement).getAttribute('src')!))) {
      const response = await page.request.get(src)
      expect(response.ok(), src).toBe(true)
      expect(response.headers()['content-type']).toContain('image/png')
    }

    // The contents jump to their sections.
    await page.getByRole('link', { name: 'Decisions', exact: true }).first().click()
    await expect(page).toHaveURL(/#decisions$/)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    expect(errors).toEqual([])
  })

  test('is linked from the start screen, in its own tab', async ({ page }) => {
    await page.goto('/')
    const link = page.getByRole('link', { name: /player's guide/i })
    await expect(link).toHaveAttribute('href', '/guide')
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('is within reach during a campaign, beside the glossary', async ({ page }) => {
    await startCampaign(page)
    const nav = page.getByRole('navigation', { name: 'Primary' })
    // The desktop rail carries it; on a phone it sits behind More.
    let link = page.getByRole('link', { name: /player's guide/i }).filter({ visible: true })
    if ((await link.count()) === 0) {
      await nav.getByRole('button', { name: 'More' }).click()
      link = page.getByRole('dialog').getByRole('link', { name: /player's guide/i })
    }
    await expect(link.first()).toHaveAttribute('href', '/guide')
    await expect(link.first()).toHaveAttribute('target', '_blank')
  })

  test('has no WCAG A/AA violations', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'chromium only')
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/guide')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((violation) => `${scheme}: ${violation.id} ${violation.nodes.length}`)).toEqual([])
    }
  })
})
