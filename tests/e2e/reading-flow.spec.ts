import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo, startCampaign } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('opening correspondence and returning preserves the selected row and Unread membership', async ({ page }) => {
  const save = prepareCampaign('e2e-reading-flow', 'year-end') as { state: GameState }
  save.state.inbox.messages = Array.from({ length: 30 }, (_, position) => ({
    id: `reading-${position}`, day: position, from: 'Sentinel SOC', subject: `Reading review ${position}`,
    body: 'The service review is ready.\n\nRead the findings before deciding what to do next.',
    type: 'business', priority: 'routine', read: false, pinned: false, relatedNodeIds: [],
  }))
  await openPreparedCampaign(page, save)
  await expect(page.getByText('How the year is read', { exact: true })).toBeVisible()
  await goTo(page, 'Inbox')
  await page.getByRole('button', { name: 'Unread', exact: true }).click()
  const list = page.getByRole('list', { name: 'Messages' })
  const count = await list.getByRole('button').count()
  const row = list.getByRole('button', { name: /Reading review 29\b/ })
  await row.click()
  const heading = page.getByRole('heading', { name: 'Reading review 29', exact: true })
  await expect(heading).toBeVisible()
  await expect(list.getByRole('button')).toHaveCount(count)
  if (page.viewportSize()!.width < 768) {
    await expect(heading).toBeFocused()
    await expect(heading).toBeInViewport()
    await page.getByRole('button', { name: 'Back to messages', exact: true }).first().click()
    await expect(row).toBeFocused()
    await expect(row).toBeInViewport()
    await row.click()
    await expect(heading).toBeFocused()
    await page.getByRole('button', { name: 'Back to messages', exact: true }).last().click()
    await expect(row).toBeFocused()
    await goTo(page, 'Risk')
    await goTo(page, 'Inbox')
    await expect(heading).toBeFocused()
    await expect(heading).toBeInViewport()
  } else {
    await expect(page.getByRole('button', { name: 'Back to messages', exact: true }).first()).toBeHidden()
  }
  await expectNoHorizontalScroll(page)
})

test('risk cards align the same four public facts and programmes retain focus when regrouped', async ({ page }) => {
  await startCampaign(page, 'e2e-reading-comparison')
  await goTo(page, 'Risk')
  const cards = page.locator('.risk-comparison-grid')
  expect(await cards.count()).toBeGreaterThan(0)
  for (const card of await cards.all()) await expect(card.locator('.comparison-label')).toHaveText(['Residual risk', 'Confidence', 'Owner', 'Next review'])
  await expectNoHorizontalScroll(page)
  await goTo(page, 'Programmes')
  await page.getByRole('button', { name: /^Start this/ }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Start the programme', exact: true }).click()
  await expect(page.getByRole('heading', { name: /^Running\b/ })).toBeVisible()
  const row = page.locator('.programme-row').first()
  const button = row.getByRole('button', { name: 'Pause', exact: true })
  await button.focus()
  await button.press('Enter')
  await expect(page.getByRole('heading', { name: /^Paused\b/ })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Resume', exact: true })).toBeFocused()
  await expectNoHorizontalScroll(page)
})


test('compact resources stay readable and the final risk tab remains reachable by keyboard', async ({ page }) => {
  await startCampaign(page, 'e2e-compact-workspace')
  if (page.viewportSize()!.width < 1024) {
    const resources = page.locator('.header-resources:visible')
    await expect(resources.locator('dt')).toHaveText(['Budget', 'Attention'])
    for (const value of await resources.locator('dd').all()) {
      await expect(value).toBeInViewport()
      expect(await value.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
  }
  await goTo(page, 'Risk')
  await expect(page.getByRole('heading', { name: 'Select a risk', exact: true })).toBeVisible()
  const tabs = page.getByRole('tablist', { name: 'Risk workspace' })
  const first = tabs.getByRole('tab', { name: /^Risk scenarios/ })
  const last = tabs.getByRole('tab', { name: /^Assumptions/ })
  await first.focus()
  await first.press('End')
  await expect(last).toBeFocused()
  await expect(last).toHaveAttribute('aria-selected', 'true')
  await expect(last).toBeInViewport()
  await last.press('Home')
  await expect(first).toBeFocused()
  await expect(first).toBeInViewport()
  if (page.viewportSize()!.width < 768) {
    const rows = await tabs.getByRole('tab').evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top)))
    expect(new Set(rows).size).toBe(1)
    await expect(page.getByText('Swipe for more tabs →')).toBeVisible()
  }
  await expectNoHorizontalScroll(page)
})
