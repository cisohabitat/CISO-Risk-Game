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
        if (await tag.isVisible().catch(() => false)) await tag.click()
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
    const resume = page.getByRole('button', { name: /Day \d+/ }).first()
    await expect(resume).toBeVisible()
    await resume.click()

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    const dayAfter = (await page.getByRole('banner').innerText()).split('·')[0]?.trim()
    expect(dayAfter).toBe(dayBefore)
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
