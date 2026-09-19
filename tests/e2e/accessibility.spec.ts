import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { goTo, startCampaign } from './helpers'

/**
 * Automated accessibility audit (plan §31). Not a substitute for manual review,
 * but it catches the regressions a checklist misses: contrast, names, roles,
 * landmarks and ARIA misuse.
 */
const SCREENS = ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board']

test.describe('accessibility', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium only')

  for (const theme of ['light', 'dark'] as const) {
    test(`has no WCAG A/AA violations in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await startCampaign(page, `a11y-${theme}`)

      for (const screen of SCREENS) {
        await goTo(page, screen)
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(
          results.violations.map((violation) => `${screen}: ${violation.id} — ${violation.description}`),
          JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html).slice(0, 3) })), null, 2),
        ).toEqual([])
      }
    })
  }

  test('the decision dialog is accessible', async ({ page }) => {
    await startCampaign(page, 'a11y-dialog')
    await page.getByRole('button', { name: 'Decide' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})
