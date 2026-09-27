import { expect, test, type Page } from '@playwright/test'
import { goTo, startCampaign } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

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

    // The Continue list, which a player only sees on their second visit: one
    // row per campaign, each with its own Delete. Two campaigns, because the
    // delete-everything control appears only where there is more than one.
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
      await dismissNote(page)
    }
    await page.getByRole('button', { name: 'Save campaign' }).click()
    await startCampaign(page, `${SEED}-b`)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    await expect(page.getByText('Continue')).toBeVisible()
    await shot(page, '01b-continue')
  })

  /**
   * A pattern offer and the first board paper, from campaigns the engine
   * prepared. This used to drive a quarter of play through the interface at
   * 4x and poll for the board paper; measured, it ran out of polls before the
   * clock reached day 91 on more runs than not, even at 2,200 polls and
   * fifteen minutes, while the engine reaches the same day instantly. The
   * screens photographed are still the real ones, loaded from a real save.
   */
  test('a pattern offer and the quarterly board paper', async ({ page }) => {
    test.setTimeout(180_000)

    // A campaign far enough in that the game has spotted a pattern.
    const patterned = prepareCampaign(SEED, 'pattern')
    await openPreparedCampaign(page, patterned)
    await dismissNote(page)
    const offer = page.getByRole('button', { name: 'Form the hypothesis' }).first()
    await expect(offer, 'no pattern was on offer in the prepared campaign').toBeVisible()
    await shot(page, '07-pattern')

    // And the same world at the end of the first quarter.
    const boardDue = prepareCampaign(SEED, 'board')
    await openPreparedCampaign(page, boardDue)
    await dismissNote(page)
    await expect(page.getByText(/board paper is due/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Prepare it' }).first().click()
    await page.getByRole('button', { name: /Prepare the Q\d board paper/ }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.waitForTimeout(250)
    await shot(page, '08-board')
  })

  test('an incident, and the closing review', async ({ page }) => {
    test.setTimeout(600_000)
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
