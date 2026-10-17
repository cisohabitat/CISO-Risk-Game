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
