import { existsSync, unlinkSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { goTo, startCampaign } from './helpers'

/**
 * Not an assertion suite: captures the screens so the visual language can be
 * reviewed. Run with `pnpm exec playwright test screenshots --project=...`.
 */
test.describe('screenshots', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium only')

  test('capture the main screens', async ({ page }, testInfo) => {
    test.setTimeout(300_000)
    // A seed that reaches an incident, so the gallery includes the screen most
    // likely to look wrong. Roughly a quarter of campaigns never have one, and
    // the default seed was one of them.
    await startCampaign(page, 'gallery-incident')
    const shot = async (name: string) => {
      // Park the pointer off every control first. Playwright leaves it where it
      // last clicked, so the gallery was photographing a hover state: the Board
      // screen was captured with the rail item above it lit, which reads as a
      // navigation bug that is not there.
      await page.mouse.move(0, 0)
      await page.waitForTimeout(120)
      await page.screenshot({ path: `screenshots/${testInfo.project.name}-${name}.png`, fullPage: false })
    }
    await shot('01-briefing')
    await page.getByRole('button', { name: 'Decide' }).first().click()
    await page.getByRole('dialog').waitFor()
    await page.waitForTimeout(400)
    await shot('02-decision')
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    for (const [index, screen] of ['Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board'].entries()) {
      await goTo(page, screen)
      if (screen === 'Organisation') {
        await page.getByText('Nexora Pay').first().waitFor({ timeout: 20_000 }).catch(() => {})
      }
      await shot(`0${index + 3}-${screen.toLowerCase()}`)
    }

    // The screens a review most needs to see are the ones that only appear
    // when something is happening. A gallery of the calm state is a gallery of
    // the easy half.
    await goTo(page, 'Briefing')
    let sawIncident = false
    let sawPattern = false
    let sawCollision = false
    let stuck = 0
    for (let click = 0; click < 260 && !sawIncident; click += 1) {
      if (!sawPattern && (await page.getByText('Pattern emerging').isVisible().catch(() => false))) {
        sawPattern = true
        await shot('11-pattern-offered')
      }
      if (!sawCollision && (await page.getByText('What is about to collide').isVisible().catch(() => false))) {
        sawCollision = true
        await shot('12-collision')
      }
      if (await page.getByText('Incident active').isVisible().catch(() => false)) {
        sawIncident = true
        // The gallery captures the viewport, and a year of play leaves the page
        // scrolled: without this the shot of the incident missed the incident.
        await page.evaluate(() => document.getElementById('main')?.scrollTo({ top: 0 }))
        await page.waitForTimeout(300)
        await shot('13-incident-command')
        break
      }
      const decide = page.getByRole('button', { name: 'Decide' }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('radio').first().check()
        const tag = dialog.getByRole('button', { name: 'Residual risk is within tolerance' })
        if (await tag.isVisible().catch(() => false)) await tag.click()
        await dialog.getByRole('button', { name: /Commit to this/ }).click()
        await expect(dialog).toBeHidden()
        continue
      }
      const board = page.getByRole('button', { name: /Prepare the Q\d board paper/ })
      if (await board.isVisible().catch(() => false)) {
        await board.click()
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('button', { name: 'Take it to the board' }).click()
        await expect(dialog).toBeHidden()
        continue
      }
      // The clock button stays on screen but goes dead while something is
      // waiting on the player, and again once the year ends. Bound the click
      // rather than testing visibility: a disabled button is visible, and
      // waiting on one is how this loop used to burn its whole timeout.
      const advance = page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first()
      const moved = await advance
        .click({ timeout: 4_000 })
        .then(() => true)
        .catch(() => false)
      if (!moved) {
        stuck += 1
        if (stuck > 3) break
      } else {
        stuck = 0
      }
    }
    // Where the loop actually got to, so a run that met nothing can be read
    // rather than guessed at.
    await shot('14-loop-end')
    // Recorded rather than asserted: this is a review aid, and a run that never
    // met an incident should say so rather than fail.
    testInfo.annotations.push({
      type: 'captured',
      description: `pattern=${sawPattern} collision=${sawCollision} incident=${sawIncident}`,
    })
    // A capture this run could not make must not leave last time's picture in
    // the gallery. The pattern offer was renamed "Pattern emerging" and this
    // spec kept looking for the old heading, so for weeks the gallery showed
    // a card that no longer existed, dated from before the rename, and said
    // nothing. Stale is worse than missing: remove it and say so.
    for (const [made, name] of [[sawPattern, '11-pattern-offered'], [sawCollision, '12-collision'], [sawIncident, '13-incident-command']] as const) {
      if (made) continue
      const stale = `screenshots/${testInfo.project.name}-${name}.png`
      if (existsSync(stale)) {
        unlinkSync(stale)
        console.warn(`screenshots: ${name} not reached this run; removed the stale ${stale}`)
      }
    }

    // The dark theme is the primary visual treatment; capture it too.
    await goTo(page, 'Briefing')
    await page.getByRole('button', { name: /Switch to dark mode/ }).click()
    await page.waitForTimeout(300)
    await shot('09-briefing-dark')
    await goTo(page, 'Risk')
    await shot('10-risk-dark')
  })
})
