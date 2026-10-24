import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('a board draft survives reviewing emerging risks at every viewport', async ({ page }) => {
  const save = prepareCampaign('e2e-fresh-board-draft', 'board') as { state: GameState }
  const risks = Object.values(save.state.risks.scenarios)
  risks[0]!.status = 'open'
  risks.at(-1)!.status = 'emerging'
  await openPreparedCampaign(page, save)
  await goTo(page, 'Board')
  await page.getByRole('button', { name: /Prepare the Q1 board paper/ }).click()
  const paper = page.getByRole('dialog', { name: 'Board paper: quarter 1' })
  await paper.getByRole('checkbox').first().check()
  const selectedLabel = await paper.getByRole('checkbox').first().evaluate((input) => input.closest('label')!.textContent)
  await paper.getByRole('button', { name: 'Identity uplift', exact: true }).click()
  await paper.getByRole('button', { name: 'Review emerging risks and return to this draft' }).click()
  await expect(page.getByRole('heading', { name: 'Risk', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Return to board paper draft' }).click()
  await expect(paper).toBeVisible()
  await expect(paper.getByRole('checkbox').first()).toBeChecked()
  expect(await paper.getByRole('checkbox').first().evaluate((input) => input.closest('label')!.textContent)).toBe(selectedLabel)
  await expect(paper.getByRole('button', { name: 'Identity uplift', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expectNoHorizontalScroll(page)
  await paper.getByRole('button', { name: 'Take it to the board', exact: true }).click()
  await expect(paper).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Board and executives' })).toBeVisible()
})
