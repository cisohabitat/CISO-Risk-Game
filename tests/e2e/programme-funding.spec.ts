import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { goTo, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('a smaller budget can fund a slower programme with both range endpoints reachable', async ({ page }) => {
  const save = prepareCampaign('balance-funding', 'day:10') as { state: GameState }
  save.state.resources.budgetRemaining = 600
  save.state.resources.focusRemaining = 5
  await openPreparedCampaign(page, save)
  await goTo(page, 'Programmes')
  const start = page.getByRole('button', { name: 'Start this: Identity and privileged access uplift', exact: true })
  await expect(start).toBeEnabled()
  await start.click()
  const dialog = page.getByRole('dialog', { name: 'Start Identity and privileged access uplift', exact: true })
  const funding = dialog.getByRole('slider')
  await expect(funding).toHaveAttribute('min', '425')
  await expect(funding).toHaveAttribute('max', '600')
  await funding.focus()
  await page.keyboard.press('Home')
  await expect(funding).toHaveValue('425')
  await page.keyboard.press('End')
  await expect(funding).toHaveValue('600')
  await expect(dialog).toContainText('underfunded, which will slow delivery')
  await dialog.getByRole('button', { name: 'Start the programme', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.programme-active').filter({ hasText: 'Identity and privileged access uplift' })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
