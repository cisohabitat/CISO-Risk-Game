import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { goTo, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('day-one guidance is open and Skip ahead on Risk holds a pending decision', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('newcomer-skip-risk', 'day:1', 'guided'))
  await expect(page.getByRole('button', { name: 'How to judge your year', exact: true })).toHaveAttribute('aria-expanded', 'true')
  await goTo(page, 'Risk')
  const date = page.locator('header.sticky p:visible').first()
  const before = await date.textContent()
  await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
  await expect(date).toHaveText(before!)
  const notice = page.getByRole('status', { name: 'Decision deadlines' })
  await expect(notice).toContainText('Skip ahead is held')
  await notice.getByRole('button', { name: /^Decide:/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('the radio itself selects an option and the reasons action scrolls and focuses a reason', async ({ page }) => {
  const save = prepareCampaign('newcomer-radio-reasons', 'day:1', 'guided') as { state: GameState }
  const id = `dec-${++save.state.decisions.counter}`
  save.state.decisions.decisions[id] = { id, defId: 'dec-launch-conditions', createdDay: 1, deadlineDay: 8, rationaleTagIds: [], assumptionIds: [], resolvedByDefault: false }
  save.state.decisions.openIds = [id]
  await openPreparedCampaign(page, save)
  await page.getByRole('button', { name: /^Decide:/ }).first().click()
  const dialog = page.getByRole('dialog')
  const radio = dialog.getByRole('radio').first()
  await radio.scrollIntoViewIfNeeded()
  const box = await radio.boundingBox()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await expect(radio).toBeChecked()
  const why = dialog.getByRole('button', { name: 'Record why first', exact: true })
  await expect(why).toBeEnabled()
  await why.click()
  await expect(dialog.locator('#decision-why-reasons button').first()).toBeFocused()
  await expectNoHorizontalScroll(page)
})
