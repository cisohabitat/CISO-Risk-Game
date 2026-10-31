import { expect, test, type Page } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { readFileSync, readdirSync } from 'node:fs'
import { openPreparedCampaign, prepareCampaign } from './prepared'
import { expectNoHorizontalScroll, goTo } from './helpers'

async function savedSetup(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('ciso-first-year', 1); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    const records = await new Promise<{ state: { difficulty: string; situationId?: string } }[]>((resolve, reject) => { const request = db.transaction('saves').objectStore('saves').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    db.close()
    return records.map((record) => ({ difficulty: record.state.difficulty, situationId: record.state.situationId }))
  })
}
for (const setup of [{ mode: 'Guided', id: 'guided', scenario: 'A tidy inheritance', situation: 'sit-tidy' }, { mode: 'High pressure', id: 'high-pressure', scenario: 'New money, short patience', situation: 'sit-new-money' }]) {
  test(`the hero starts ${setup.mode} with ${setup.scenario} and reload returns to title`, async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-saves-ready="true"][data-campaign-ready="true"]')).toBeVisible()
    await page.getByRole('radio', { name: new RegExp(`^${setup.mode}`) }).check()
    await page.getByRole('radio', { name: new RegExp(`^${setup.scenario}`) }).check()
    await expect(page.getByTestId('start-selection')).toContainText(`${setup.mode} · ${setup.scenario}`)
    await page.getByRole('button', { name: 'Begin your first year', exact: true }).click()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    await expect.poll(() => savedSetup(page)).toContainEqual({ difficulty: setup.id, situationId: setup.situation })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'CISO: First Year', exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Continue campaign', exact: true })).toBeVisible()
    await expect(page.getByTestId('build-revision')).toContainText(/build [a-f0-9]{7}/)
    await expectNoHorizontalScroll(page)
  })
}

test('the Right Arrow shortcut cannot skip from Week 48 to the year close', async ({ page }) => {
  const save = prepareCampaign('bounded-shortcut', 'day:1', 'guided') as { state: GameState }
  save.state.currentDay = 329
  save.state.resources.weekIndex = 47
  save.state.decisions.openIds = []
  save.state.threats.actors = {}; save.state.threats.campaigns = []
  for (const objective of Object.values(save.state.business.objectives)) objective.status = 'achieved'
  save.state.events.suppressedEventIds = readdirSync('src/content/nexora/events').filter((file) => file.endsWith('.json')).flatMap((file) => (JSON.parse(readFileSync(`src/content/nexora/events/${file}`, 'utf8')) as { events: { id: string }[] }).events.map((event) => event.id))
  await openPreparedCampaign(page, save)
  await page.locator('#main').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.morning-brief')).toContainText('Week 49')
  await expect(page.getByRole('heading', { name: /Finish your final day|The year has closed/ })).toHaveCount(0)
  await expectNoHorizontalScroll(page)
})

test('delivery warnings and enquiry coaching appear during Guided play with a linked triage refusal', async ({ page }) => {
  const save = prepareCampaign('guided-next-checks', 'day:1', 'guided') as { state: GameState }
  save.state.currentDay = 155
  for (const objective of Object.values(save.state.business.objectives)) objective.status = 'achieved'
  Object.assign(save.state.business.objectives['obj-platform-launch']!, { status: 'active', progress: 0.85 })
  save.state.team.functions.engineering!.capacity = 0
  await openPreparedCampaign(page, save)
  await expect(page.getByLabel('Business delivery watch')).toContainText('Launch the new customer platform')
  await page.getByRole('button', { name: 'Review business dates', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Business objectives', exact: true })).toBeFocused()
  await expect(page.getByRole('region', { name: 'Business objectives', exact: true })).toContainText('Date at risk')
  await page.getByRole('button', { name: 'Choose the next enquiry' }).click()
  const all = page.getByRole('button', { name: /Show all .*enquiries/ })
  if (await all.isVisible()) await all.click()
  const triage = page.getByRole('button', { name: 'Commission: Vulnerability triage by exposure', exact: true })
  await expect(triage).toBeDisabled()
  await expect(triage).toHaveAccessibleDescription('The team it needs has no spare capacity.')
  await expectNoHorizontalScroll(page)
})

test('two available optional agenda items can both be checked', async ({ page }) => {
  const save = prepareCampaign('two-optional-updates', 'day:1', 'guided') as { state: GameState }
  save.state.currentDay = 91; save.state.reviews.pendingQuarter = 1
  Object.values(save.state.risks.scenarios).forEach((risk, i) => { risk.status = i < 2 ? 'open' : 'emerging'; risk.lastAssessed = { day: 91, exposure: 0.01, consequence: 0.01, residual: 0.01 } })
  await openPreparedCampaign(page, save)
  await goTo(page, 'Board')
  await page.getByRole('button', { name: /Prepare the Q1/ }).click()
  const dialog = page.getByRole('dialog')
  const optional = dialog.locator('label.board-agenda-row').filter({ hasText: 'Optional update' }).getByRole('checkbox')
  await expect(optional).toHaveCount(2)
  await optional.nth(0).check(); await optional.nth(1).check()
  await expect(optional.nth(0)).toBeChecked(); await expect(optional.nth(1)).toBeChecked()
  await expect(dialog.getByLabel('Agenda guidance')).toContainText('2 optional updates selected')
  await expectNoHorizontalScroll(page)
})
