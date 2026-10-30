import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { readFileSync, readdirSync } from 'node:fs'
import { goTo, expectNoHorizontalScroll } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('the last skip shows December alerts, the Corvus return and refunds before opening the review', async ({ page }) => {
  const save = prepareCampaign('ciso-december-handover', 'day:1', 'guided') as { state: GameState }
  const state = save.state
  state.currentDay = 363
  state.decisions.openIds = []
  state.events.suppressedEventIds = readdirSync('src/content/nexora/events').filter((file) => file.endsWith('.json')).flatMap((file) => {
    const pack = JSON.parse(readFileSync(`src/content/nexora/events/${file}`, 'utf8')) as { events: { id: string }[] }
    return pack.events.map((event) => event.id)
  })
  state.resources.budgetRemaining = 105
  state.pendingEffects = [
    { id: 'final-corvus', day: 364, source: 'decision:dec-q4-corvus-terms', note: 'The Corvus contract outcome is now recorded.', effects: [] },
    { id: 'licence-return', day: 364, source: 'test', effects: [{ type: 'budget.change', amount: 60, note: 'An unused licence has been cancelled.' }] },
    { id: 'duplicate-return', day: 364, source: 'test', effects: [{ type: 'budget.change', amount: 90, note: 'A duplicate tool has been cancelled.' }] },
  ]
  state.inbox.messages.push({ id: `msg-${++state.inbox.counter}`, day: 363, from: 'Threat intelligence', subject: 'Credentials in circulation', body: 'The final credential alert remains available.', type: 'threat', priority: 'urgent', read: false, pinned: false, relatedNodeIds: [] })
  await openPreparedCampaign(page, save)
  await goTo(page, 'Risk')
  await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
  const handover = page.getByRole('heading', { name: 'The year has closed', exact: true }).locator('..')
  await expect(handover).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Annual review sections' })).toHaveCount(0)
  await expect(handover.getByRole('button', { name: /Credentials in circulation/ })).toBeVisible()
  await expect(handover).toContainText('£255k available')
  await handover.getByRole('button', { name: /Followed up: Corvus renewal/ }).click()
  await expect(page.locator('#message-reader')).toContainText('The Corvus contract outcome is now recorded.')
  await expectNoHorizontalScroll(page)
  await handover.getByRole('button', { name: 'Read the annual review', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Annual review sections' })).toBeVisible()
})

test('clearing the CIO constraint leaves a receipt and an unaffordable shim stays disabled', async ({ page }) => {
  const save = prepareCampaign('ciso-blocker-receipt', 'day:1', 'guided') as { state: GameState }
  Object.assign(save.state.programmes.programmes['prog-identity']!, { status: 'at-risk', startedDay: 1, progress: 0.6, budgetAllocated: 850, blockers: [{ id: 'blk-identity-exec', startedDay: 1, resolved: false }, { id: 'blk-identity-legacy', startedDay: 1, resolved: false }] })
  save.state.resources.budgetRemaining = 105
  save.state.resources.focusRemaining = 5
  await openPreparedCampaign(page, save)
  await goTo(page, 'Programmes')
  await expect(page.getByRole('button', { name: /^Fund a compatibility shim/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Hold the line with the CIO', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Blocker cleared' })).toContainText('Used 1 attention and £0k budget')
  await expect(page.getByText('This constraint slows delivery.', { exact: false }).first()).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('the board paper keeps the raised register visible including closed entries', async ({ page }) => {
  const save = prepareCampaign('ciso-raised-register', 'day:1', 'guided') as { state: GameState }
  save.state.currentDay = 91
  save.state.reviews.pendingQuarter = 1
  const [open, closed] = Object.values(save.state.risks.scenarios)
  open!.status = 'open'
  closed!.status = 'closed'
  await openPreparedCampaign(page, save)
  await goTo(page, 'Board')
  await page.getByRole('button', { name: /Prepare the Q1/ }).click()
  const dialog = page.getByRole('dialog')
  const registerButton = dialog.getByRole('button', { name: /^Raised risk register/ })
  await registerButton.click()
  const registerId = await registerButton.getAttribute('aria-controls')
  const register = page.locator(`[id="${registerId}"]`)
  await expect(register.getByText(/closed; not a current agenda item/)).toBeVisible()
  await expect(register.getByText(/available on the agenda below/)).toBeVisible()
  await expectNoHorizontalScroll(page)
})
