import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { goTo, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('an empty response decision list returns keyboard focus to the journal', async ({ page }) => {
  const save = prepareCampaign('visual-incident', 'incident') as { state: GameState }
  save.state.decisions.openIds = []
  await openPreparedCampaign(page, save)
  await goTo(page, 'Briefing')
  await page.getByRole('button', { name: 'Review the active incident', exact: true }).click()
  await expect(page.locator('#incident-command')).toBeFocused()
  await expect(page.locator('#incident-command')).toBeInViewport()
  await expectNoHorizontalScroll(page)
})

test('workload capacity and struggling functions have separate routes in the shell', async ({ page }) => {
  const save = prepareCampaign('guidance-team', 'board') as { state: GameState }
  save.state.team.functions.engineering!.morale = 0.2
  save.state.team.functions.iam!.morale = 0.2
  await openPreparedCampaign(page, save)
  const nav = page.getByRole('navigation', { name: 'Primary' })
  const wellbeing = page.getByTestId('team-wellbeing-summary')
  if (await wellbeing.isVisible()) {
    await expect(wellbeing).toContainText('Engineering burning out')
    await expect(wellbeing).toContainText('Identity burning out')
    await wellbeing.getByRole('button').click()
  } else {
    await nav.getByRole('button', { name: 'More', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Workload capacity:')
    await expect(dialog).toContainText('Engineering burning out')
    await expect(dialog).toContainText('Identity burning out')
    await dialog.getByRole('button', { name: 'Review workload and recovery', exact: true }).click()
    await expect(dialog).toBeHidden()
  }
  await expect(page.getByRole('heading', { name: 'Team', exact: true })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
