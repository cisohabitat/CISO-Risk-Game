import { expect, test } from '@playwright/test'
import { goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

// The 15-run playtest of November, its interface findings.

test('the Briefing offers one control per waiting decision', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('fifteen-run-one-control', 'day:2'))
  const decide = page.getByRole('button', { name: /^Decide: / })
  await expect(decide.first()).toBeVisible()
  for (const label of await decide.evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? button.textContent ?? ''))) {
    const title = label.replace(/^Decide: /, '')
    await expect(page.getByRole('button', { name: new RegExp(`^(Decide|Review): ${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })).toHaveCount(1)
  }
  await decide.first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('the deadline strip opens the board paper itself', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('fifteen-run-board-paper', 'board'))
  await page.getByRole('button', { name: 'Open the Q1 board paper' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Take it to the board', exact: true })).toBeVisible()
  // Closed, it stays closed: the request is read once.
  await page.keyboard.press('Escape')
  await goTo(page, 'Briefing')
  await goTo(page, 'Board')
  await expect(page.getByRole('button', { name: 'Take it to the board', exact: true })).toHaveCount(0)
})
