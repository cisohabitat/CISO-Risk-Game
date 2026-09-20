import { expect, test, type Page } from '@playwright/test'
import { goTo, startCampaign } from './helpers'

/**
 * The pictures in docs/PLAYER_GUIDE.md.
 *
 * Not the gallery: that photographs whatever a seed happens to produce, for
 * review. These are a deliberate sequence following a first hour, so the guide
 * can be regenerated when a screen changes rather than going quietly stale.
 *
 *   pnpm guide:shots
 *
 * Three independent tests rather than one long one, each starting its own
 * campaign. The screens that only appear later in a year take minutes of
 * simulated time to reach, and a single sequence meant one slow phase stopped
 * the rest being captured at all.
 */

/** Transient confirmations sit over the page for five seconds: noise in a guide. */
async function clearToasts(page: Page): Promise<void> {
  const status = page.locator('[role="status"]')
  for (let i = 0; i < 4; i += 1) {
    const dismiss = status.getByRole('button', { name: 'Dismiss' }).first()
    if (!(await dismiss.isVisible().catch(() => false))) break
    await dismiss.click().catch(() => undefined)
    await page.waitForTimeout(80)
  }
}

async function shot(page: Page, name: string): Promise<void> {
  await clearToasts(page)
  // Park the pointer so nothing is caught mid-hover, and let motion settle.
  await page.mouse.move(0, 0)
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))),
  )
  await page.waitForTimeout(150)
  await page.screenshot({ path: `docs/images/${name}.png`, fullPage: false })
}

/** A teaching note sits over everything until dismissed, as it does for a player. */
async function dismissNote(page: Page): Promise<boolean> {
  const got = page.getByRole('button', { name: 'Got it' }).first()
  if (!(await got.isVisible().catch(() => false))) return false
  await got.click()
  return true
}

/**
 * One turn of ordinary play: clear the note, form what is offered, answer what
 * is asked, otherwise advance. Every probe takes `.first()` — a locator that
 * resolves to more than one element throws in strict mode, and a `catch` around
 * it turns that into a silent "not visible" that never fires the branch.
 */
async function playOn(page: Page): Promise<'moved' | 'ended'> {
  if (await dismissNote(page)) return 'moved'

  const offer = page.getByRole('button', { name: 'Form the hypothesis' }).first()
  if ((await offer.isVisible().catch(() => false)) && !(await offer.isDisabled())) {
    await offer.click()
    return 'moved'
  }

  const decide = page.getByRole('button', { name: /^Decide$/ }).first()
  if (await decide.isVisible().catch(() => false)) {
    await decide.click()
    await page.getByRole('radio').first().check()
    const why = page.getByRole('button', { name: /Record why first/ }).first()
    if (await why.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'More evidence is required' }).first().click()
    }
    const commit = page.getByRole('button', { name: /Commit to this/ }).first()
    if (await commit.isVisible().catch(() => false)) await commit.click()
    else await page.keyboard.press('Escape')
    return 'moved'
  }

  const skip = page.getByRole('button', { name: 'Skip ahead' }).first()
  if (!(await skip.isVisible().catch(() => false))) return 'ended'
  await skip.click()
  return 'moved'
}

// A seed whose year has something on every board paper and more than one
// incident, so the pictures show the screens doing their job rather than empty.
const SEED = 'guide-2'

test.describe('player guide', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium only')

  test('the screens a player meets in the first hour', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    await shot(page, '01-start')

    await startCampaign(page, SEED)
    await dismissNote(page)
    await shot(page, '02-briefing')

    await page.getByRole('button', { name: /^Decide$/ }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('radio').first().check()
    await shot(page, '03-decision')
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()

    await goTo(page, 'Risk')
    await shot(page, '04-risk')
    await page.getByText('Investigate', { exact: true }).first().click()
    await shot(page, '05-investigate')

    await goTo(page, 'Organisation')
    await page.getByRole('button', { name: 'List', exact: true }).first().click().catch(() => undefined)
    await page.waitForTimeout(400)
    await shot(page, '06-organisation')
  })

  /**
   * The slow one. Reaching the first board paper means covering a quarter
   * through the interface, and neither stepping event by event nor running the
   * in-game clock has proved quick or reliable about it. If this fails, the
   * committed picture is still current — re-run it alone, or leave it.
   */
  test('a pattern offer and the quarterly board paper', async ({ page }) => {
    test.setTimeout(600_000)
    await startCampaign(page, SEED)

    // Reaching the first board paper means covering a quarter. Stepping it
    // event by event costs one round trip per stop and took twenty minutes;
    // the game's own 4x clock covers the same ground while this polls, and
    // only stops for the things that pause it.
    await page.getByRole('button', { name: '4×' }).first().click()
    let sawPattern = false

    for (let i = 0; i < 900; i += 1) {
      await page.waitForTimeout(200)
      await dismissNote(page)

      // Time pauses itself for anything worth stopping for, not only for
      // decisions, so the clock has to be restarted each time or the poll
      // loop spins against a stopped world.
      const resume = page.getByRole('button', { name: 'Resume time' }).first()
      if (await resume.isVisible().catch(() => false)) {
        await resume.click().catch(() => undefined)
        await page.getByRole('button', { name: '4×' }).first().click().catch(() => undefined)
      }

      if (!sawPattern) {
        const offer = page.getByRole('button', { name: 'Form the hypothesis' }).first()
        if (await offer.isVisible().catch(() => false)) {
          await shot(page, '07-pattern')
          sawPattern = true
          if (!(await offer.isDisabled())) await offer.click()
        }
      }

      if (await page.getByText(/board paper is due/i).first().isVisible().catch(() => false)) {
        await page.getByRole('button', { name: 'Prepare it' }).first().click()
        await page.getByRole('button', { name: /Prepare the Q\d board paper/ }).first().click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.waitForTimeout(250)
        await shot(page, '08-board')
        expect(sawPattern, 'no pattern was offered before the board paper').toBe(true)
        return
      }

      // The clock pauses for a decision; answer it and let time run again.
      const decide = page.getByRole('button', { name: /^Decide$/ }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        await page.getByRole('radio').first().check()
        const why = page.getByRole('button', { name: /Record why first/ }).first()
        if (await why.isVisible().catch(() => false)) {
          await page.getByRole('button', { name: 'More evidence is required' }).first().click()
        }
        const commit = page.getByRole('button', { name: /Commit to this/ }).first()
        if (await commit.isVisible().catch(() => false)) await commit.click()
        else await page.keyboard.press('Escape')
        await page.getByRole('button', { name: '4×' }).first().click().catch(() => undefined)
      }
    }
    throw new Error('never reached a board paper')
  })

  test('an incident, and the closing review', async ({ page }) => {
    test.setTimeout(900_000)
    await startCampaign(page, SEED)
    let sawIncident = false

    for (let i = 0; i < 500; i += 1) {
      if (!sawIncident && (await page.getByText('Incident active').first().isVisible().catch(() => false))) {
        await shot(page, '09-incident')
        sawIncident = true
      }
      if (await page.getByText('Annual review').first().isVisible().catch(() => false)) break
      if ((await playOn(page)) === 'ended') break
    }

    await page.waitForTimeout(400)
    await shot(page, '10-review')
    expect(sawIncident, 'the year had no incident to photograph').toBe(true)
    await expect(page.getByText('Annual review').first()).toBeVisible()
  })
})
