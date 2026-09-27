import { expect, test, type Page } from '@playwright/test'
import { expectNoHorizontalScroll, goTo, offscreenControls, startCampaign } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

/**
 * What is actually in the save store, rather than what the start screen shows.
 * The list groups by campaign defensively, so it stays right even when storage
 * is not; only reading the records pins the storage rule itself.
 */
async function savedRecords(page: Page): Promise<{ key: string; gameId: string; day: number }[]> {
  return page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const open = indexedDB.open('ciso-first-year')
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    const all: { slot: string; state?: { gameId?: string; currentDay?: number } }[] = await new Promise(
      (resolve, reject) => {
        const request = db.transaction('saves', 'readonly').objectStore('saves').getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      },
    )
    db.close()
    return all.map((record) => ({
      key: record.slot,
      gameId: record.state?.gameId ?? '',
      day: record.state?.currentDay ?? -1,
    }))
  })
}

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
    // A campaign is one save, so the badge is what proves the Save campaign
    // button wrote anything: without it the autosave would answer for a button
    // that did nothing at all.
    const resume = page.getByRole('button', { name: /Day \d+/ }).filter({ hasText: 'e2e-save' }).first()
    await expect(resume, 'no save appeared to resume from').toBeVisible()
    await expect(resume, 'the save was not marked as one the player asked for').toContainText('Saved by you')
    await resume.click()

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    const dayAfter = (await page.getByRole('banner').innerText()).split('·')[0]?.trim()
    expect(dayAfter).toBe(dayBefore)
  })

  test('a campaign is one save, however long it is played', async ({ page }) => {
    // Rolling autosave slots put one campaign on the start screen three times,
    // a row per recent day, and interleaved a second campaign with the first.
    // Nothing said those rows were the same year, so they read as several games.
    const rows = page.getByRole('button', { name: /Day \d+/ })
    const play = async (turns: number) => {
      for (let i = 0; i < turns; i += 1) {
        const got = page.getByRole('button', { name: 'Got it' }).first()
        if (await got.isVisible().catch(() => false)) await got.click()
        await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
      }
    }

    await startCampaign(page, 'e2e-one')
    await play(4)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    await expect(rows, 'one campaign is listed more than once').toHaveCount(1)
    await expect(rows.first()).toContainText('e2e-one')
    const afterOne = await savedRecords(page)
    expect(afterOne.length, `one campaign wrote ${afterOne.length} saves: ${afterOne.map((r) => r.key).join(', ')}`).toBe(1)

    // A second campaign is a second row, and does not disturb the first.
    await startCampaign(page, 'e2e-two')
    await play(2)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    await expect(rows).toHaveCount(2)
    await expect(rows.filter({ hasText: 'e2e-one' })).toHaveCount(1)
    await expect(rows.filter({ hasText: 'e2e-two' })).toHaveCount(1)
    const afterTwo = await savedRecords(page)
    expect(afterTwo.length, 'two campaigns are not two saves').toBe(2)
    expect(new Set(afterTwo.map((record) => record.gameId)).size, 'the two saves are of the same campaign').toBe(2)
  })

  test('saves from the rolling-slot era collapse to one per campaign', async ({ page }) => {
    // The upgrade path for a player who already has three autosaves of the
    // same year. Their campaign is rewritten as it was stored then, and the
    // newest of the three has to survive as the one save.
    await startCampaign(page, 'e2e-legacy')
    await page.getByRole('button', { name: 'Save campaign' }).click()
    await expect(page.getByText('Campaign saved.')).toBeVisible()

    const days = await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((resolve, reject) => {
        const open = indexedDB.open('ciso-first-year')
        open.onsuccess = () => resolve(open.result)
        open.onerror = () => reject(open.error)
      })
      const read = db.transaction('saves', 'readonly').objectStore('saves')
      const all: { slot: string; savedAtIso: string; state: { currentDay: number } }[] = await new Promise(
        (resolve, reject) => {
          const request = read.getAll()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        },
      )
      const record = all[0]!
      const store = db.transaction('saves', 'readwrite').objectStore('saves')
      store.delete(record.slot)
      // Oldest first, as the rolling slots held them: auto-0 was the newest.
      const written = [30, 20, 10].map((day, index) => {
        const copy = {
          ...record,
          slot: `auto-${index}`,
          savedAtIso: new Date(Date.parse(record.savedAtIso) - index * 60_000).toISOString(),
          state: { ...record.state, currentDay: day },
        }
        store.put(copy)
        return day
      })
      await new Promise((resolve) => setTimeout(resolve, 100))
      db.close()
      return written
    })
    expect(days).toEqual([30, 20, 10])

    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    const rows = page.getByRole('button', { name: /Day \d+/ })
    await expect(rows, 'the three rolling autosaves are still three rows').toHaveCount(1)
    await expect(rows.first(), 'the newest of the three did not survive').toContainText('Day 30')
    const collapsed = await savedRecords(page)
    expect(collapsed.length, 'the duplicate rolling saves are still in storage').toBe(1)
    expect(collapsed[0]!.day, 'the surviving save is not the newest of the three').toBe(30)
    expect(collapsed[0]!.key, 'the surviving save is not keyed by its campaign').toMatch(/^campaign:/)

    // And the survivor still loads.
    await rows.first().click()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  })

  test('a word in a decision opens the glossary on top, and Escape closes only the glossary', async ({ page }) => {
    // The glossary opens as a second dialog over the decision. Both listened on
    // the document, so Escape closed the decision underneath first.
    await startCampaign(page, 'e2e-words')
    const got = page.getByRole('button', { name: 'Got it' }).first()
    // Answer the opening decision so the CEO's question, which names
    // ransomware, is the one waiting.
    for (let i = 0; i < 12; i += 1) {
      if (await got.isVisible().catch(() => false)) await got.click()
      const ceo = page.getByText('The CEO wants your three risks').first()
      if (await ceo.isVisible().catch(() => false)) break
      const decide = page.getByRole('button', { name: /^Decide$/ }).first()
      if (await decide.isVisible().catch(() => false)) {
        await decide.click()
        const dialog = page.getByRole('dialog')
        await dialog.getByRole('radio').first().check()
        const why = dialog.getByRole('button', { name: /Record why first/ })
        if (await why.isVisible().catch(() => false)) await dialog.getByRole('button', { pressed: false }).first().click()
        await dialog.getByRole('button', { name: /Commit to this/ }).click()
        continue
      }
      await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
    }
    await page.getByRole('button', { name: /^Decide$/ }).first().click()
    const decision = page.getByRole('dialog', { name: 'The CEO wants your three risks' })
    await expect(decision).toBeVisible()
    await decision.getByRole('button', { name: 'Ransomware' }).click()
    const glossary = page.getByRole('dialog', { name: 'Glossary' })
    await expect(glossary).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(glossary, 'Escape did not close the glossary').toBeHidden()
    await expect(decision, 'Escape closed the decision underneath the glossary').toBeVisible()
    await page.keyboard.press('Escape')
    await expect(decision).toBeHidden()
  })

  test('a decision can be taken with the keyboard alone, with the clock running', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'keyboard play is a desktop concern')
    await startCampaign(page, 'e2e-keyboard')
    const got = page.getByRole('button', { name: 'Got it' }).first()
    if (await got.isVisible().catch(() => false)) await got.click()
    await page.getByRole('button', { name: '1×' }).click()
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        return { tag: el?.tagName, id: el?.id, text: (el?.textContent ?? '').trim().slice(0, 40), inDialog: Boolean(el?.closest('[role=dialog]')) }
      })

    const decide = page.getByRole('button', { name: /^Decide$/ }).first()
    await decide.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect((await focused()).inDialog, 'focus did not move into the dialog').toBe(true)

    for (let i = 0; i < 5 && (await focused()).tag !== 'INPUT'; i += 1) await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    const chosen = await dialog.locator('input[type=radio]:checked').getAttribute('value')
    expect(chosen).toBeTruthy()
    // The clock is running. Every dialog re-rendered on each tick, and each
    // render put focus back on the panel within a second.
    await page.waitForTimeout(2500)
    expect((await focused()).tag, 'a running clock took focus off the chosen option').toBe('INPUT')

    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
    for (let i = 0; i < 25 && !(await focused()).text.includes('Commit'); i += 1) await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    // The button that opened it is gone with the decision; focus should not
    // fall to the page body and send the player back to the top.
    expect((await focused()).tag, 'focus fell to the page body').not.toBe('BODY')
  })

  test('the year can begin in a different situation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    // The usual opening is chosen unless the player picks another.
    await expect(page.getByRole('radio', { name: /The inherited mess/ })).toBeChecked()
    await page.getByRole('radio', { name: /After the breach/ }).check()
    await page.getByRole('button', { name: 'Begin your first day' }).click()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible({ timeout: 20_000 })
    // Emergency money on top of the usual £2.4m, and the CEO says why.
    await expect(page.getByText('£2.8m of £2.8m')).toBeVisible()
    await goTo(page, 'Inbox')
    await expect(page.getByText('You know why the job was open').first()).toBeVisible()
    // And the Continue list says which year it was.
    await page.getByRole('button', { name: 'Save campaign' }).click()
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Day \d+ · ciso · After the breach/ })).toBeVisible()
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

  test('a dialog taller than the screen scrolls, and its buttons stay reachable', async ({ page }) => {
    // A phone player reported the pop-ups ran off the bottom of the screen
    // with no way to scroll them. The first decision is the tallest dialog
    // most players meet, so it is the one measured.
    await startCampaign(page, 'e2e-dialog')
    const got = page.getByRole('button', { name: 'Got it' }).first()
    if (await got.isVisible().catch(() => false)) await got.click()
    await page.getByRole('button', { name: /^Decide$/ }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // The panel rises into place; measure it once it has arrived.
    await dialog.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)))
    const viewport = page.viewportSize()!
    const commit = dialog.getByRole('button', { name: /Commit to this|Record why first/ })

    // Capped: the panel fits the screen and the footer is on it without scrolling.
    const panel = (await dialog.boundingBox())!
    expect(panel.y + panel.height, 'the dialog runs off the bottom of the screen').toBeLessThanOrEqual(viewport.height + 1)
    const footer = (await commit.boundingBox())!
    expect(footer.y + footer.height).toBeLessThanOrEqual(viewport.height + 1)
    // ...and the body scrolls to the last option.
    const last = dialog.getByRole('radio').last()
    await last.scrollIntoViewIfNeeded()
    const lastBox = (await last.boundingBox())!
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(viewport.height + 1)

    // ...and because it fits, the overlay must not be scrollable at all: a
    // flick over the dimmed backdrop otherwise drags the whole dialog up and
    // its title off the top of the screen.
    const overlay = await dialog.evaluate((el) => {
      const node = el.parentElement!.parentElement as HTMLElement
      return { scrollHeight: node.scrollHeight, clientHeight: node.clientHeight }
    })
    // A pixel of tolerance for sub-pixel rounding across engines; the bug this
    // catches was 489 of them.
    expect(overlay.scrollHeight, 'the overlay scrolls although the dialog fits it').toBeLessThanOrEqual(
      overlay.clientHeight + 1,
    )

    // Uncapped, standing in for a browser that does not know `dvh` and drops
    // the height cap: the overlay itself scrolls, so the footer is still
    // reachable rather than stranded below the bottom edge.
    await page.addStyleTag({ content: '[role=dialog]{max-height:none!important}' })
    await commit.scrollIntoViewIfNeeded()
    const reached = (await commit.boundingBox())!
    expect(reached.y + reached.height, 'the footer cannot be scrolled to').toBeLessThanOrEqual(viewport.height + 1)
    expect(reached.y).toBeGreaterThanOrEqual(0)
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

    // A finished year used to have no way out short of reloading the page.
    await expect(page.getByText(/can also start from/)).toBeVisible()
    await page.getByRole('button', { name: 'Start another year' }).click()
    await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
    await expect(page.getByText(/seed e2e-full-year/).first()).toBeVisible()
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

  // Day one is the emptiest the screens ever are. Mid-year they carry running
  // programmes, raised risks with trend badges, incidents and a full timeline,
  // and the close carries the longest text in the game.
  test('screens hold together mid-year and at the close', async ({ page }, info) => {
    test.setTimeout(120_000)
    await openPreparedCampaign(page, prepareCampaign('e2e-midyear', 'day:200'))
    for (const screen of ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board', 'Your year']) {
      await goTo(page, screen)
      await expectNoHorizontalScroll(page)
      const offscreen = await offscreenControls(page)
      expect(offscreen, `controls off-screen on ${screen}: ${offscreen.join(', ')}`).toEqual([])
      if (process.env.PHONE_SHOTS) await page.screenshot({ path: `test-results/mid-${info.project.name}-${screen}.png`, fullPage: true })
    }
    await page.getByRole('button', { name: 'Write up the year now' }).click()
    await expect(page.getByText('How the year is read')).toBeVisible()
    await expectNoHorizontalScroll(page)
    const offscreen = await offscreenControls(page)
    expect(offscreen, `controls off-screen on the review: ${offscreen.join(', ')}`).toEqual([])
    if (process.env.PHONE_SHOTS) await page.screenshot({ path: `test-results/mid-${info.project.name}-review.png`, fullPage: true })
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

  test('a toast is spoken from a live region that was already on the page', async ({ page }) => {
    await startCampaign(page, 'e2e-live')
    // Screen readers do not reliably announce a live region's initial content,
    // so the region has to exist, empty, before the first toast arrives.
    const region = page.getByTestId('toasts')
    await expect(region).toHaveAttribute('aria-live', 'polite')
    await expect(region).toBeEmpty()
    const before = await region.elementHandle()
    await page.getByRole('button', { name: 'Save campaign' }).click()
    await expect(region).toContainText('Campaign saved')
    expect(await region.elementHandle().then((after) => after?.evaluate((node, earlier) => node === earlier, before))).toBe(true)
    await expect(page.getByTestId('pause-reason')).toHaveAttribute('role', 'status')
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
    // An unwritten paper costs something when the next quarter closes, so the
    // screen says when that is: the Q1 paper is due the day before Q2 closes.
    await expect(page.getByTestId('paper-deadline')).toContainText('Write it by 1 July')
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
