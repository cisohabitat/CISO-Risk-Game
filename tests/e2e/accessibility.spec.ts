import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { goTo, startCampaign } from './helpers'

/**
 * Automated accessibility audit (plan §31). Not a substitute for manual review,
 * but it catches the regressions a checklist misses: contrast, names, roles,
 * landmarks and ARIA misuse.
 */
const SCREENS = ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board']

/**
 * Screens and dialogs animate in from opacity 0 over ~220ms, and both
 * toBeVisible() and a click resolve on the first frame. Axe then measures
 * contrast against a half-transparent panel: the same commit gave 75 green
 * tests on one run and a colour-contrast violation on the next, reporting
 * #71767d on #eff2f5 for text that settles at 7.8:1 on white. Wait for the
 * motion to finish so the audit reads the screen a player actually sees.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
  )
}

test.describe('accessibility', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium only')

  for (const theme of ['light', 'dark'] as const) {
    test(`has no WCAG A/AA violations in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await startCampaign(page, `a11y-${theme}`)

      for (const screen of SCREENS) {
        await goTo(page, screen)
        await settle(page)
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
    await settle(page)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(
      results.violations.map((violation) => violation.id),
      JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => ({ html: n.html, why: n.any.map((a) => a.message) })) })), null, 2),
    ).toEqual([])
  })
})
