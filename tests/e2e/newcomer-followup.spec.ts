import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { GameState } from '../../src/game/types'
import { goTo, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('a newcomer can understand the review, follow evidence and revisit dismissed teaching', async ({ page }) => {
  const save = prepareCampaign('newcomer-reading', 'day:1', 'guided')
  await openPreparedCampaign(page, save)
  const guidance = page.getByRole('button', { name: 'How to judge your year', exact: true })
  if (await guidance.getAttribute('aria-expanded') === 'false') await guidance.click()
  await expect(page.getByText(/The annual review weighs eight dimensions equally/)).toBeVisible()
  await goTo(page, 'Risk')
  await expect(page.getByText(/you still choose the agenda in the board paper/)).toBeVisible()
  await page.getByRole('button', { name: 'Start with evidence', exact: true }).click()
  await expect(page.getByRole('tab', { name: /^Evidence/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'Keep this guide folded', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Where to start with Risk' })).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('button', { name: 'Got it', exact: true }).click()
  const help = page.locator('summary', { hasText: 'Help and settings' })
  if (await help.isVisible()) await help.click()
  else await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'More', exact: true }).click()
  await page.getByRole('button', { name: 'Teaching tips', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'A first quarter, in three questions', exact: true }).click()
  await expect(dialog.getByText(/Before the Q1 board paper/)).toBeVisible()
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))))
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await expectNoHorizontalScroll(page)
})

test('an impending decision remains visible across screens and time pauses before it lapses', async ({ page }) => {
  const save = prepareCampaign('newcomer-deadline', 'day:1', 'guided') as { state: GameState }
  const decision = save.state.decisions.decisions[save.state.decisions.openIds[0]!]!
  decision.deadlineDay = save.state.currentDay + 2
  save.state.speed = 'paused'
  save.state.paused = true
  await openPreparedCampaign(page, save)
  const notice = page.getByRole('status', { name: 'Decision deadlines' })
  await expect(notice).toBeVisible()
  await goTo(page, 'Risk')
  await expect(notice).toBeVisible()
  const fast = page.getByRole('button', { name: '4×', exact: true })
  if (await fast.isVisible()) {
    await fast.click()
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toHaveAttribute('aria-pressed', 'true')
  } else {
    await page.getByRole('button', { name: 'Resume time', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Resume time', exact: true })).toBeVisible()
  }
  await expect(notice.getByText(/due in 1 day/).first()).toBeVisible()
  await notice.getByRole('button', { name: /^Review:/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByText(/This is due today|Due in 1 day/)).toBeVisible()
})
