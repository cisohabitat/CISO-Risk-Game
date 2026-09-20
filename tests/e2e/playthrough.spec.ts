import { test } from '@playwright/test'
import { goTo, startCampaign } from './helpers'

/**
 * Not a check: one campaign played with intent, photographed as it goes, so the
 * screens can be looked at in the order a player meets them. Run on demand.
 */
test.describe('playthrough', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium only')

  test('a year at Nexora', async ({ page }, testInfo) => {
    test.setTimeout(600_000)
    let frame = 0
    const shot = async (name: string) => {
      frame += 1
      await page.evaluate(() => document.getElementById('main')?.scrollTo({ top: 0 }))
      await page.waitForTimeout(150)
      await page.screenshot({ path: `playthrough/${String(frame).padStart(2, '0')}-${name}.png` })
    }

    await startCampaign(page, 'playthrough-1')
    await shot('day-one')

    // The first thing the game asks of you.
    await page.getByRole('button', { name: 'Decide' }).first().click()
    await page.getByRole('dialog').waitFor()
    await page.waitForTimeout(300)
    await shot('first-decision')
    await page.getByRole('dialog').getByRole('radio').first().check()
    const tag = page.getByRole('dialog').getByRole('button', { name: 'More evidence is required' })
    if (await tag.isVisible().catch(() => false)) await tag.click()
    await page.getByRole('dialog').getByRole('button', { name: /Commit to this/ }).click()

    // Where a new CISO would go looking.
    await goTo(page, 'Risk')
    await shot('risk-screen')
    await goTo(page, 'Organisation')
    await page.waitForTimeout(600)
    await shot('organisation')
    await goTo(page, 'Programmes')
    await shot('programmes')
    await goTo(page, 'Team')
    await shot('team')

    // Commission something, because the game says information must be bought.
    await goTo(page, 'Risk')
    await page.getByRole('tab', { name: 'Investigate' }).click()
    await page.waitForTimeout(300)
    await shot('investigate')
    const commission = page.getByRole('button', { name: 'Commission' }).first()
    if (await commission.isVisible().catch(() => false)) {
      await commission.click()
      const dialog = page.getByRole('dialog')
      await dialog.waitFor()
      await page.waitForTimeout(300)
      await shot('commission-dialog')
      await dialog.getByRole('button', { name: 'Commission the work' }).click()
    }

    await goTo(page, 'Briefing')
    let shotPattern = false
    let shotCollision = false
    let shotIncident = false
    let shotBoard = false
    let stuck = 0

    for (let step = 0; step < 400; step += 1) {
      if (!shotPattern && (await page.getByText('Pattern emerging').isVisible().catch(() => false))) {
        shotPattern = true
        await shot('pattern-offered')
        await page.getByRole('button', { name: 'Form the hypothesis' }).first().click()
        await page.waitForTimeout(400)
        await goTo(page, 'Risk')
        await shot('after-forming')
        await goTo(page, 'Briefing')
        continue
      }
      if (!shotCollision && (await page.getByText('What is about to collide').isVisible().catch(() => false))) {
        shotCollision = true
        await shot('collision')
      }
      if (!shotIncident && (await page.getByText('Incident active').isVisible().catch(() => false))) {
        shotIncident = true
        await shot('incident')
      }
      const board = page.getByRole('button', { name: /Prepare the Q\d board paper/ })
      if (await board.isVisible().catch(() => false)) {
        await board.click()
        const dialog = page.getByRole('dialog')
        await dialog.waitFor()
        if (!shotBoard) {
          shotBoard = true
          await page.waitForTimeout(300)
          await shot('board-paper')
        }
        await dialog.getByRole('button', { name: 'Take it to the board' }).click()
        continue
      }
      const decide = page.getByRole('button', { name: 'Decide' }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('radio').first().check()
        const rationale = dialog.getByRole('button', { name: 'Residual risk is within tolerance' })
        if (await rationale.isVisible().catch(() => false)) await rationale.click()
        await dialog.getByRole('button', { name: /Commit to this/ }).click()
        continue
      }
      const advance = page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first()
      const moved = await advance.click({ timeout: 4_000 }).then(() => true).catch(() => false)
      if (!moved) {
        stuck += 1
        if (stuck > 3) break
      } else stuck = 0
    }

    await shot('late-year')
    const review = page.getByRole('button', { name: 'Read the annual review' })
    if (await review.isVisible().catch(() => false)) await review.click()
    await page.waitForTimeout(500)
    await shot('annual-review-top')
    await page.evaluate(() => document.getElementById('main')?.scrollTo({ top: 1400 }))
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'playthrough/98-annual-review-reasoning.png' })
    await page.evaluate(() => document.getElementById('main')?.scrollTo({ top: 3200 }))
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'playthrough/99-annual-review-end.png' })
    testInfo.annotations.push({
      type: 'saw',
      description: `pattern=${shotPattern} collision=${shotCollision} incident=${shotIncident} board=${shotBoard}`,
    })
  })
})
