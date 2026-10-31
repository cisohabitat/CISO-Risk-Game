import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { GameState } from '../../src/game/types'
import { goTo, startCampaign, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('a delayed review shows progress and opens without a reload', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/assets/review-*.js', async (route) => { await pending; await route.continue() })
  try {
    await startCampaign(page, 'ciso-review-loading')
    await goTo(page, 'Your year')
    await page.getByRole('button', { name: 'Write up the year now', exact: true }).click()
    await page.getByRole('button', { name: 'End the year and write it up', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Writing your review…', exact: true })).toBeDisabled()
    await expect(page.getByRole('dialog')).toContainText('Time is held while it loads')
    release()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText('Overall assessment', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Write up the year now', exact: true })).toHaveCount(0)
    await expectNoHorizontalScroll(page)
  } finally { release() }
})

test('a failed review download gives a recovery route and preserves the exportable campaign', async ({ page }) => {
  await page.route('**/assets/review-*.js', (route) => route.abort())
  await startCampaign(page, 'ciso-review-failed')
  await goTo(page, 'Your year')
  await page.getByRole('button', { name: 'Write up the year now', exact: true }).click()
  await page.getByRole('button', { name: 'End the year and write it up', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Your campaign is kept')
  await expect(page.getByRole('button', { name: 'End the year and write it up', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your year, day by day', exact: true })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export this campaign', exact: true }).click()
  const exported = JSON.parse(await readFile((await (await download).path())!, 'utf8')) as { state: GameState }
  expect(exported.state.seed).toBe('ciso-review-failed')
  expect(exported.state.finished).toBe(false)
  expect(exported.state.reviews.annual).toBeUndefined()
  await page.unroute('**/assets/review-*.js')
  await page.reload()
  await page.getByRole('button', { name: 'Continue campaign', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  await goTo(page, 'Your year')
  await page.getByRole('button', { name: 'Write up the year now', exact: true }).click()
  await page.getByRole('button', { name: 'End the year and write it up', exact: true }).click()
  await expect(page.getByText('Overall assessment', { exact: true })).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('an empty board paper requires acknowledgement and its chair response remains honest', async ({ page }) => {
  const save = prepareCampaign('ciso-empty-board', 'day:1', 'ciso') as { state: GameState }
  save.state.currentDay = 91; save.state.reviews.pendingQuarter = 1
  for (const risk of Object.values(save.state.risks.scenarios)) risk.status = 'emerging'
  save.state.incidents.incidents = {}; save.state.incidents.order = []
  save.state.assumptions.assumptions = {}
  for (const fn of Object.values(save.state.team.functions)) fn.morale = 1
  await openPreparedCampaign(page, save)
  await goTo(page, 'Board')
  await page.getByRole('button', { name: /Prepare the Q1/ }).click()
  const paper = page.getByRole('dialog')
  const submit = paper.getByRole('button', { name: 'Take it to the board' })
  await expect(submit).toBeDisabled()
  await paper.getByRole('checkbox', { name: 'I intend to submit an empty paper.' }).check()
  await submit.click()
  await expect(paper).toBeHidden()
  await expect(page.getByRole('main', { name: 'Board', exact: true }).getByText(/The board notes that nothing has yet been assessed/)).toBeVisible()
})

test('a quarter recap leaves Skip ahead available on CISO without dismissal', async ({ page }) => {
  const save = prepareCampaign('ciso-recap-skip', 'day:1', 'ciso') as { state: GameState }
  save.state.currentDay = 90; save.state.resources.weekIndex = 12
  save.state.decisions.openIds = []; save.state.pendingEffects = []
  save.state.threats.actors = {}; save.state.threats.campaigns = []
  for (const objective of Object.values(save.state.business.objectives)) objective.status = 'achieved'
  await openPreparedCampaign(page, save)
  const skip = page.getByRole('button', { name: 'Skip ahead', exact: true })
  await skip.click()
  await expect(page.getByRole('button', { name: 'Dismiss quarter recap' })).toBeVisible()
  await expect(skip).toBeInViewport()
  await skip.click()
  await expect(page.getByRole('button', { name: 'Dismiss quarter recap' })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
