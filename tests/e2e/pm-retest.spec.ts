import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { acknowledgeEmptyPaper, goTo, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('Q3 announces its paper on every screen and starts with its material agenda selected', async ({ page }) => {
  const save = prepareCampaign('pm-paper-alert', 'day:1', 'high-pressure') as { state: GameState }
  save.state.currentDay = 273
  save.state.reviews.pendingQuarter = 3
  Object.values(save.state.risks.scenarios)[0]!.status = 'accepted'
  await openPreparedCampaign(page, save)
  await expect(page.getByRole('status', { name: 'Decision deadlines' })).toContainText('Q3 board paper ready')
  await page.getByRole('button', { name: 'Review board paper', exact: true }).click()
  await expect(page.getByText(/Q4 closes in the annual review/)).toBeVisible()
  await page.getByRole('button', { name: /Prepare the Q3 board paper/ }).click()
  const paper = page.getByRole('dialog')
  await expect(paper.getByLabel('Agenda guidance')).toContainText('No optional agenda updates are available today')
  await expect(paper.getByLabel('Agenda guidance')).toContainText('0 optional updates selected')
  const required = paper.locator('label').filter({ hasText: 'Required: material to this committee' }).getByRole('checkbox')
  expect(await required.count()).toBeGreaterThan(0)
  for (const item of await required.all()) await expect(item).toBeChecked()
  await expectNoHorizontalScroll(page)
  await acknowledgeEmptyPaper(paper)
  await paper.getByRole('button', { name: 'Take it to the board', exact: true }).click()
  await expect(paper).toBeHidden()
  await expect(page.getByRole('status', { name: 'Decision deadlines' })).not.toContainText('Q3 board paper ready')
})

test('spending attention at high speed leaves time held after the action', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 640, 'Fast speed controls are available from the tablet breakpoint.')
  await openPreparedCampaign(page, prepareCampaign('pm-fast-action', 'day:1', 'high-pressure'))
  await goTo(page, 'Board')
  await page.getByRole('button', { name: '4×', exact: true }).click()
  await page.getByRole('button', { name: /^Listen:/ }).first().click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const date = page.locator('header.sticky p:visible').first()
  const held = await date.textContent()
  await page.waitForTimeout(1200)
  await expect(date).toHaveText(held!)
})
