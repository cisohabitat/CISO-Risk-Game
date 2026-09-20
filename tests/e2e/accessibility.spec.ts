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

  /**
   * The debrief was outside the audit because nothing navigated to it: the only
   * route was a banner shown once the year was over, so the one screen carrying
   * chart colour shipped unchecked. It is a destination now, so both themes get
   * audited with the timeline drawn and its list open.
   */
  for (const theme of ['light', 'dark'] as const) {
    test(`the year timeline is accessible in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await startCampaign(page, `a11y-year-${theme}`)

      // Give the lanes something to draw before auditing them.
      for (let i = 0; i < 5; i += 1) {
        const decide = page.getByRole('button', { name: /^Decide$/ }).first()
        if (await decide.isVisible().catch(() => false)) {
          await decide.click()
          const dialog = page.getByRole('dialog')
          await dialog.getByRole('radio').first().check()
          const tag = dialog.getByRole('button', { name: 'Residual risk is within tolerance' })
          if (await tag.isVisible().catch(() => false)) await tag.click()
          const commit = dialog.getByRole('button', { name: /Commit to this/ })
          if (await commit.isVisible().catch(() => false)) await commit.click()
          await expect(dialog).toBeHidden()
          continue
        }
        await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
      }

      await goTo(page, 'Your year')
      await expect(page.getByText('Your year, day by day')).toBeVisible()
      // Audit the readable equivalent too, not only the figure.
      await page.getByText('Read the year as a list').click()
      await settle(page)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(
        results.violations.map((violation) => `${violation.id} — ${violation.description}`),
        JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html).slice(0, 3) })), null, 2),
      ).toEqual([])
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
