import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, goTo, offscreenControls, startCampaign } from './helpers'

test.describe('a first year at Nexora', () => {
  test('a new player reaches a real decision within the first minute', async ({ page }) => {
    const started = Date.now()
    await startCampaign(page, 'e2e-opening')

    // The opening decision is waiting on the briefing screen.
    await expect(page.getByRole('heading', { name: 'Where do you start?' })).toBeVisible()
    await page.getByRole('button', { name: 'Decide' }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Start with the business services')).toBeVisible()
    // No option leaks a hidden number at the player.
    await expect(dialog).not.toContainText(/[+-]\d+\s*(security|risk|trust)/i)

    await dialog.getByRole('radio').first().check()
    await dialog.getByRole('button', { name: /Commit to this/ }).click()
    await expect(dialog).toBeHidden()

    expect(Date.now() - started).toBeLessThan(60_000)
  })

  test('evidence becomes a hypothesis and then a risk scenario', async ({ page }) => {
    await startCampaign(page, 'e2e-risk')
    await goTo(page, 'Risk')

    // Commission work: information is a resource that has to be spent for.
    await page.getByRole('tab', { name: 'Investigate' }).click()
    await expect(page.getByText('Lines of enquiry')).toBeVisible()
    const commission = page.getByRole('button', { name: 'Commission' }).first()
    await commission.click()
    const commissionDialog = page.getByRole('dialog')
    await expect(commissionDialog).toBeVisible()
    await commissionDialog.getByRole('button', { name: 'Commission the work' }).click()
    await expect(page.getByText('Work in progress')).toBeVisible()

    // Advance until the delegated work reports back.
    await page.getByRole('tab', { name: /^Evidence/ }).click()
    for (let i = 0; i < 25; i += 1) {
      if (await page.getByRole('tabpanel').getByText(/confidence/i).first().isVisible().catch(() => false)) break
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
      const decide = page.getByRole('button', { name: 'Decide' }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const open = page.getByRole('dialog')
        await open.getByRole('radio').first().check()
        const tag = open.getByRole('button', { name: 'Residual risk is within tolerance' })
        // A decision that does not offer that reason offers others; take the first.
        if (await tag.isVisible().catch(() => false)) await tag.click()
        else await open.locator('button[aria-pressed]').first().click()
        await open.getByRole('button', { name: /Commit to this/ }).click()
        await expect(open).toBeHidden()
        await page.getByRole('tab', { name: /^Evidence/ }).click()
      }
    }
    await expect(page.getByRole('tabpanel')).toContainText(/confidence/i)

    await page.getByRole('tab', { name: 'Hypotheses' }).click()
    const form = page.getByRole('button', { name: 'Form a hypothesis' })
    if (await form.isEnabled()) {
      await form.click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio').first().check()
      await dialog.getByRole('checkbox').first().check()
      await dialog.getByRole('button', { name: 'Record it' }).click()
      await expect(page.getByText('Working hypotheses')).toBeVisible()
      await page.getByRole('button', { name: 'Raise as a risk scenario' }).first().click()
      await page.getByRole('tab', { name: 'Risk scenarios' }).click()
      await expect(page.getByRole('tabpanel')).toContainText(/residual|Open/i)
    }
  })

  test('starting a programme spends budget and shows delivery over time', async ({ page }) => {
    await startCampaign(page, 'e2e-programme')
    await goTo(page, 'Programmes')
    await expect(page.getByRole('heading', { name: 'Programmes' })).toBeVisible()

    await page.getByRole('button', { name: 'Start this' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Start the programme' }).click()
    await expect(page.getByText('Under way').first()).toBeVisible()
    await expect(page.getByText('Delivery confidence').first()).toBeVisible()
  })

  test('the campaign saves and resumes from the same point', async ({ page }) => {
    await startCampaign(page, 'e2e-save')
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }
    await page.getByRole('button', { name: 'Save campaign' }).click()
    // Wait for the save to actually land before reloading the tab.
    await expect(page.getByText('Campaign saved.')).toBeVisible()
    const dayBefore = (await page.getByRole('banner').innerText()).split('·')[0]?.trim()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    // Resume the manual save specifically. The game also autosaves on every
    // action, so resuming "whatever is newest" passed even when the Save
    // campaign button wrote nothing at all — the autosave answered for it.
    const resume = page.getByRole('button', { name: /Day \d+/ }).filter({ hasText: 'manual' }).first()
    await expect(resume, 'no manual save appeared to resume from').toBeVisible()
    await resume.click()

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    const dayAfter = (await page.getByRole('banner').innerText()).split('·')[0]?.trim()
    expect(dayAfter).toBe(dayBefore)
  })

  test('a saved campaign can be deleted, and stays deleted', async ({ page }) => {
    await startCampaign(page, 'e2e-delete')
    await page.getByRole('button', { name: 'Save campaign' }).click()
    await expect(page.getByText('Campaign saved.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    const row = page.getByRole('button', { name: /Day \d+/ }).filter({ hasText: 'e2e-delete' })
    await expect(row.first(), 'the saved campaign did not appear to resume from').toBeVisible()

    // Deleting asks first, and keeping it changes nothing.
    await page.getByRole('button', { name: 'Delete the campaign with seed e2e-delete' }).first().click()
    await expect(page.getByRole('dialog', { name: 'Delete this campaign?' })).toBeVisible()
    await page.getByRole('button', { name: 'Keep it' }).click()
    await expect(row.first()).toBeVisible()

    // Confirming removes every save of it: the manual save and the autosaves.
    await page.getByRole('button', { name: 'Delete the campaign with seed e2e-delete' }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete the campaign', exact: true }).click()
    await expect(page.getByText(/Campaign deleted/)).toBeVisible()
    await expect(row).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    await expect(page.getByText('seed e2e-delete')).toHaveCount(0)
  })

  test('the organisation view only shows what has been discovered', async ({ page }) => {
    await startCampaign(page, 'e2e-org')
    await goTo(page, 'Organisation')
    await expect(page.getByRole('heading', { name: 'Organisation' })).toBeVisible()
    await expect(page.getByText(/you have not found|Nothing remains hidden/)).toBeVisible()

    // Undiscovered systems must not appear anywhere in the view.
    await expect(page.getByText('Warehouse Management (Meridian)')).toHaveCount(0)
  })

  test('the dependency graph renders and has a list equivalent', async ({ page }) => {
    await startCampaign(page, 'e2e-graph')
    await goTo(page, 'Organisation')

    const width = page.viewportSize()?.width ?? 1280
    if (width >= 640) {
      await page.getByRole('button', { name: 'Graph', exact: true }).click()
      // The graph library is lazy-loaded, so give the chunk time to arrive.
      await expect(page.getByText('Nexora Pay').first()).toBeVisible({ timeout: 20_000 })
    }

    // The list view is always available, and is the default on small screens.
    await page.getByRole('button', { name: 'List', exact: true }).click()
    const list = page.getByRole('list', { name: 'Discovered systems' })
    await expect(list.getByText('Nexora Pay').first()).toBeVisible()
    await expect(list.getByText('Business service').first()).toBeVisible()
  })

  test('the glossary is reachable from anywhere', async ({ page }) => {
    await startCampaign(page, 'e2e-glossary')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    const direct = nav.getByRole('button', { name: 'Glossary' })
    if (await direct.isVisible().catch(() => false)) {
      await direct.click()
    } else {
      await nav.getByRole('button', { name: 'More' }).click()
      await page.getByRole('dialog').getByRole('button', { name: /Glossary/ }).click()
    }
    await expect(page.getByRole('dialog').getByText('Residual exposure')).toBeVisible()
  })

  test('time advances, events arrive and the clock pauses for what matters', async ({ page }) => {
    await startCampaign(page, 'e2e-time')
    for (let i = 0; i < 6; i += 1) {
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }
    await goTo(page, 'Inbox')
    const messages = page.getByRole('list', { name: 'Messages' }).getByRole('listitem')
    expect(await messages.count()).toBeGreaterThan(1)
  })

  test('a whole year can be played through to the annual review', async ({ page }) => {
    test.setTimeout(300_000)
    await startCampaign(page, 'e2e-full-year')

    for (let i = 0; i < 320; i += 1) {
      // Finishing the year switches to the debrief automatically.
      if (await page.getByText('Annual review').first().isVisible().catch(() => false)) break
      const banner = page.getByRole('button', { name: 'Read the annual review' })
      if (await banner.isVisible().catch(() => false)) {
        await banner.click()
        break
      }

      // Answer anything blocking, then keep moving.
      const decide = page.getByRole('button', { name: 'Decide' }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('radio').first().check()
        const tag = dialog.getByRole('button', { name: 'Residual risk is within tolerance' })
        // A decision that does not offer that reason offers others; take the first.
        if (await tag.isVisible().catch(() => false)) await tag.click()
        else await dialog.locator('button[aria-pressed]').first().click()
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

      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }

    await expect(page.getByText('Annual review').first()).toBeVisible()
    await expect(page.getByText('How the year is read')).toBeVisible()
    await expect(page.getByText('What the business achieved')).toBeVisible()
  })

  test('core screens hold together at this viewport', async ({ page }) => {
    await startCampaign(page, 'e2e-responsive')
    for (const screen of ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board']) {
      await goTo(page, screen)
      await expectNoHorizontalScroll(page)
      const offscreen = await offscreenControls(page)
      expect(offscreen, `controls off-screen on ${screen}: ${offscreen.join(', ')}`).toEqual([])
    }
  })

  test('the rail marks where you are with something hover cannot imitate', async ({ page }) => {
    // The rail is a desktop affordance; narrow widths get the bottom bar, which
    // distinguishes the current page by colour and has no hover to confuse it.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'no rail at this width')
    await startCampaign(page, 'e2e-rail')
    // Hover and selected were 3.5% of lightness and one font weight apart, so
    // resting the pointer anywhere in the rail read as the current page.
    await goTo(page, 'Board')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await nav.getByRole('button', { name: 'Team', exact: true }).first().hover()
    const marks = async (label: string) =>
      nav
        .getByRole('button', { name: label, exact: true })
        .first()
        .locator('span[aria-hidden="true"].absolute')
        .count()
    expect(await marks('Board'), 'the page you are on carries no marker').toBe(1)
    expect(await marks('Team'), 'hovering an item marks it as current').toBe(0)
  })

  test('a toast is dismissable without swallowing the page under it', async ({ page }) => {
    await startCampaign(page, 'e2e-toast')
    await page.getByRole('button', { name: 'Decide' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio').first().check()
    await dialog.getByRole('button', { name: /Commit to this/ }).click()
    await expect(dialog).toBeHidden()

    const status = page.locator('[role="status"]')
    const box = await status.locator('div').first().boundingBox()
    if (box) {
      // Three of these stack above the fold, over the Decide button.
      const hit = await page.evaluate(
        ({ x, y }) => (document.elementFromPoint(x, y)?.closest('[role="status"]') ? 'toast' : 'page'),
        { x: box.x + 20, y: box.y + box.height / 2 },
      )
      expect(hit, 'the toast body intercepts clicks meant for the page').toBe('page')
      await status.getByRole('button', { name: 'Dismiss' }).first().click()
      await expect(status.getByRole('button', { name: 'Dismiss' }).first()).toBeHidden()
    }
  })

  test('an offer the player cannot afford says so instead of refusing after the click', async ({ page }) => {
    await startCampaign(page, 'e2e-attention')
    // Find a day that offers a pattern.
    for (let i = 0; i < 60; i += 1) {
      const offer = page.getByRole('button', { name: 'Form the hypothesis' })
      if (await offer.isVisible().catch(() => false)) break
      const skip = page.getByRole('button', { name: 'Skip ahead' })
      if (!(await skip.isVisible().catch(() => false))) break
      await skip.click()
      const got = page.getByRole('button', { name: 'Got it' })
      if (await got.isVisible().catch(() => false)) await got.click()
    }
    const offer = page.getByRole('button', { name: 'Form the hypothesis' })
    if (!(await offer.isVisible().catch(() => false))) test.skip(true, 'no pattern offered in this run')

    // Form until the attention runs out, which is what a player does.
    for (let i = 0; i < 6; i += 1) {
      const live = page.getByRole('button', { name: 'Form the hypothesis' })
      if (!(await live.isVisible().catch(() => false))) break
      if (await live.isDisabled()) break
      await live.click()
      const got = page.getByRole('button', { name: 'Got it' })
      if (await got.isVisible().catch(() => false)) await got.click()
      await page.waitForTimeout(150)
    }

    // Whatever happened above, the contract is asserted here unconditionally.
    // This used to sit inside `if (week.startsWith('0'))`, which on this seed
    // never ran, so the test was green with the `disabled` prop removed. The
    // deterministic guard is tests/ui/pattern-notice.test.tsx; this one
    // confirms the same contract survives the real screen, or says clearly
    // that it could not be reached rather than passing quietly.
    const live = page.getByRole('button', { name: 'Form the hypothesis' })
    const week = await page.getByText(/of 5 left/).first().innerText().catch(() => '')
    if (!(await live.isVisible().catch(() => false)) || !week.startsWith('0')) {
      test.skip(true, `could not reach an unaffordable offer on this seed (week reads "${week}")`)
    }
    await expect(live, 'the offer stays live with no attention to spend').toBeDisabled()
    await expect(page.getByText('No attention left this week.')).toBeVisible()
  })

  test('a player who never leaves the Briefing is still told the board paper is due', async ({ page }) => {
    await startCampaign(page, 'e2e-board-prompt')
    // The quarterly review lived only on the Board screen. A player working
    // from the Briefing could take every decision in good time and still be
    // told at the close that they prepared none of the four.
    let found = false
    for (let i = 0; i < 160; i += 1) {
      // A teaching note sits over everything until it is dismissed, as it does
      // for a player.
      const got = page.getByRole('button', { name: 'Got it' })
      if (await got.isVisible().catch(() => false)) { await got.click(); continue }
      if (await page.getByText(/board paper is due/i).isVisible().catch(() => false)) { found = true; break }
      const decide = page.getByRole('button', { name: /^Decide$/ })
      if (await decide.first().isVisible().catch(() => false)) {
        await decide.first().click()
        await page.getByRole('radio').first().check()
        // Some decisions require a reason, and the button says so by renaming
        // itself "Record why first" rather than sitting dead.
        const why = page.getByRole('button', { name: /Record why first/ }).first()
        if (await why.isVisible().catch(() => false)) {
          await page.getByRole('button', { name: 'More evidence is required' }).first().click()
        }
        const commit = page.getByRole('button', { name: /Commit to this/ }).first()
        if (await commit.isVisible().catch(() => false)) await commit.click()
        else await page.keyboard.press('Escape')
        await page.waitForTimeout(150)
        continue
      }
      const skip = page.getByRole('button', { name: 'Skip ahead' })
      if (!(await skip.isVisible().catch(() => false))) break
      await skip.click()
    }
    expect(found, 'a whole quarter passed on the Briefing with no sign of the board paper').toBe(true)
    await page.getByRole('button', { name: 'Prepare it' }).click()
    await expect(page.getByRole('button', { name: /Prepare the Q\d board paper/ })).toBeVisible()
  })

  test('a dialog can always be closed', async ({ page }) => {
    await startCampaign(page, 'e2e-dialog')
    await page.getByRole('button', { name: 'Decide' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toBeHidden()

    await page.getByRole('button', { name: 'Decide' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('a priced option shows its price rather than calling itself expensive', async ({ page }) => {
    await startCampaign(page, 'e2e-price')

    // Walk the year until a decision with a priced option comes up. Fifteen of
    // the eighty options carry one; the first few decisions may not.
    let found = false
    for (let i = 0; i < 40 && !found; i += 1) {
      const decide = page.getByRole('button', { name: /^Decide$/ }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        // A price reads as £120k or £1.2m, beside the option it belongs to.
        if (await dialog.getByText(/£\d+(\.\d+)?[km]/).first().isVisible().catch(() => false)) {
          found = true
          // Never an adjective standing in for a number the business knows.
          await expect(dialog.getByText('Expensive', { exact: true })).toHaveCount(0)
        }
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }
      if (!found) {
        await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
      }
    }
    expect(found, 'no priced decision option appeared in the first 40 stops').toBe(true)
  })

  test('the harder modes do not print the answer above the options', async ({ page }) => {
    // Guided explains; CISO does not. The note is the profile's
    // `showsDecisionCoaching`, so this is the dial seen from the outside.
    await startCampaign(page, 'e2e-coach') // the start screen defaults to CISO
    let sawNote = false
    for (let i = 0; i < 25 && !sawNote; i += 1) {
      const decide = page.getByRole('button', { name: /^Decide$/ }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        if (await dialog.getByText(/usually more effective than|can build more credibility/).first().isVisible().catch(() => false)) {
          sawNote = true
        }
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }
    expect(sawNote, 'CISO printed a teaching note naming the preferred answer').toBe(false)
  })

  test('the year is visible while there is still year left to change', async ({ page }) => {
    await startCampaign(page, 'e2e-year')

    for (let i = 0; i < 6; i += 1) {
      const decide = page.getByRole('button', { name: /^Decide$/ }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('radio').first().check()
        const tag = dialog.getByRole('button', { name: 'Residual risk is within tolerance' })
        // A decision that does not offer that reason offers others; take the first.
        if (await tag.isVisible().catch(() => false)) await tag.click()
        else await dialog.locator('button[aria-pressed]').first().click()
        const commit = dialog.getByRole('button', { name: /Commit to this/ })
        if (await commit.isVisible().catch(() => false)) await commit.click()
        await expect(dialog).toBeHidden()
        continue
      }
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }

    await goTo(page, 'Your year')
    await expect(page.getByText('Your year, day by day')).toBeVisible()

    // Six lanes, each named in words — identity is never the colour alone.
    // Scoped to the figure: several of these words are also navigation items,
    // and on a narrow viewport those sit in the closed "More" sheet, where an
    // unscoped match finds a hidden copy instead of the lane.
    const figure = page.getByRole('figure', { name: /Your year at Nexora/ })
    await expect(figure).toBeVisible()
    for (const lane of ['Decisions', 'Programmes', 'Enquiries', 'Board papers', 'Assumptions', 'Incidents']) {
      await expect(figure.getByText(lane, { exact: true }).first()).toBeVisible()
    }

    // And every mark is also a sentence with its day on it.
    await page.getByText('Read the year as a list').click()
    await expect(page.getByText(/Day \d+/).first()).toBeVisible()
  })

  test('the briefing leads with what needs an answer, not with four gauges', async ({ page }) => {
    await startCampaign(page, 'e2e-brief')

    // A brief, not a dashboard: it says what kind of document it is and how
    // much wants the player, before any standing state.
    await expect(page.getByText(/CISO brief · Week \d+/i)).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/needs? your attention|Nothing is waiting on you/)

    // The four standing readings are one strip of definitions, not four cards.
    const standing = page.getByRole('region', { name: 'Where the organisation stands' })
    await expect(standing).toBeVisible()
    for (const label of ['Residual exposure', 'Board confidence', 'Team capacity', 'Recovery confidence']) {
      await expect(standing.getByText(label, { exact: true })).toBeVisible()
    }

    // A risk leads with the scenario. If the rating is the most prominent
    // thing on it, players optimise the rating instead of reading the risk.
    const firstRisk = page.getByRole('heading', { name: /.+/, level: 3 }).first()
    await expect(firstRisk).toBeVisible()
  })

  test('a collision is drawn as a race, without inventing a date', async ({ page }) => {
    await startCampaign(page, 'e2e-race')

    let found = false
    for (let i = 0; i < 60 && !found; i += 1) {
      if (await page.getByText('What is about to collide').first().isVisible().catch(() => false)) {
        found = true
        break
      }
      const decide = page.getByRole('button', { name: 'Decide' }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('radio').first().check()
        const tag = dialog.getByRole('button', { name: 'Residual risk is within tolerance' })
        // A decision that does not offer that reason offers others; take the first.
        if (await tag.isVisible().catch(() => false)) await tag.click()
        else await dialog.locator('button[aria-pressed]').first().click()
        await dialog.getByRole('button', { name: /Commit to this/ }).click()
        await expect(dialog).toBeHidden()
        continue
      }
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }

    expect(found, 'no collision appeared in the first 60 stops').toBe(true)
    // Two tracks on one scale, and the verdict in words beside them.
    await expect(page.getByText('The business', { exact: true }).first()).toBeVisible()
    await expect(
      page.getByText(/Arrives (before|after) the business|Arrives about the same time|Nothing is running/).first(),
    ).toBeVisible()
  })

  test('no uncaught errors during normal play', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await startCampaign(page, 'e2e-errors')
    for (const screen of ['Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board', 'Briefing']) {
      await goTo(page, screen)
    }
    for (let i = 0; i < 5; i += 1) {
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }
    expect(errors, errors.join('\n')).toEqual([])
  })
})
