import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { goTo, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('material omissions require an informed choice before submission', async ({ page }) => {
  const save = prepareCampaign('combined-board-safeguard', 'board') as { state: GameState }
  Object.values(save.state.risks.scenarios)[0]!.status = 'accepted'
  await openPreparedCampaign(page, save)
  await goTo(page, 'Board')
  await page.getByRole('button', { name: /Prepare the Q1 board paper/ }).click()
  const paper = page.getByRole('dialog')
  // Checkbox text lives on the wrapping label, so select those labels directly.
  const requiredInputs = paper.locator('label').filter({ hasText: 'Required: material to this committee' }).getByRole('checkbox')
  for (const checkbox of await requiredInputs.all()) {
    await expect(checkbox).toBeChecked()
    await checkbox.uncheck()
  }
  await paper.getByRole('button', { name: 'Take it to the board', exact: true }).click()
  const warning = paper.getByRole('alert')
  await expect(warning).toContainText('Omitting material information affects its confidence')
  await expect(warning.getByRole('checkbox')).not.toBeChecked()
  await expectNoHorizontalScroll(page)
  await warning.getByRole('button', { name: 'Include all material items' }).click()
  await paper.getByRole('button', { name: 'Take it to the board', exact: true }).click()
  await expect(paper).toBeHidden()
})

test('reading a decision holds the clock until the player explicitly resumes', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('combined-reading-pause', 'day:1', 'guided'))
  const fast = page.getByRole('button', { name: '4×', exact: true })
  if (await fast.isVisible()) await fast.click()
  else await page.getByRole('button', { name: 'Resume time', exact: true }).click()
  await page.getByRole('button', { name: /^Decide: / }).first().click()
  const paper = page.getByRole('dialog')
  await expect(paper).toBeVisible()
  const date = page.locator('header.sticky p:visible').first()
  const heldDate = await date.textContent()
  // More than a normal-speed day and five 4x callbacks must leave the date held.
  await page.waitForTimeout(1200)
  await expect(date).toHaveText(heldDate!)
  await paper.getByRole('button', { name: 'Close', exact: true }).click()
  if (await fast.isVisible()) await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveAttribute('aria-pressed', 'true')
  else await expect(page.getByRole('button', { name: 'Resume time', exact: true })).toBeVisible()
})
