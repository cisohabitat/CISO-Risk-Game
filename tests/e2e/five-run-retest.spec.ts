import { readFileSync, readdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('a decision arriving on 31 December can be read and answered before explicit year closure', async ({ page }) => {
  const save = prepareCampaign('final-day-playable', 'day:1', 'guided') as { state: GameState }
  save.state.currentDay = 363
  save.state.decisions.openIds = []
  save.state.events.suppressedEventIds = readdirSync('src/content/nexora/events').filter((file) => file.endsWith('.json')).flatMap((file) => {
    const pack = JSON.parse(readFileSync(`src/content/nexora/events/${file}`, 'utf8')) as { events: { id: string }[] }
    return pack.events.map((event) => event.id)
  })
  save.state.pendingEffects = [{ id: 'final-question', source: 'test', day: 364, effects: [{ type: 'decision.open', decisionId: 'dec-q4-priorities' }] }]
  await openPreparedCampaign(page, save)
  await goTo(page, 'Risk')
  await page.getByRole('button', { name: /Skip ahead|Advance to next event/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Finish your final day' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Annual review sections' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Close year', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText("Next year's priorities, in writing")
  await page.getByRole('button', { name: 'Keep playing the final day', exact: true }).click()
  await goTo(page, 'Briefing')
  await page.getByRole('button', { name: /^Decide: Next year's priorities/ }).click()
  const decision = page.getByRole('dialog')
  await decision.getByRole('radio', { name: /Lead with what you still do not know/ }).check()
  await decision.locator('button[aria-pressed]').first().click()
  await decision.getByRole('button', { name: 'Commit to this', exact: true }).click()
  await expect(decision).toBeHidden()
  await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Close year', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'The year has closed', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Read the annual review', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Annual review sections' })).toBeVisible()
})

test('objectives are visible during play and reference letters do not inflate the update badge', async ({ page }) => {
  const save = prepareCampaign('objective-and-reference', 'day:1', 'guided') as { state: GameState }
  const template = save.state.inbox.messages[0]!
  save.state.inbox.messages = Array.from({ length: 60 }, (_, i) => ({ ...template, id: `msg-${i + 100}`, subject: `Reference letter ${i}`, priority: 'routine', decisionId: undefined, eventId: undefined, signalCampaignId: undefined, read: false }))
  save.state.inbox.messages.unshift({ ...template, id: 'msg-160', subject: 'Immediate review', priority: 'urgent', decisionId: undefined, eventId: undefined, read: false })
  save.state.inbox.counter = 160
  await openPreparedCampaign(page, save)
  const tracker = page.getByRole('region', { name: 'Business objectives', exact: true })
  await expect(tracker).toContainText('Enter the Nordic market')
  await expect(tracker.getByText(/Committed for/)).toHaveCount(5)
  await expect(page.locator('[data-testid="inbox-unread-count"]:visible')).toHaveAttribute('title', '1 unread updates')
  await expectNoHorizontalScroll(page)
  await goTo(page, 'Inbox')
  await page.getByRole('button', { name: 'Reference', exact: true }).click()
  await expect(page.getByRole('list', { name: 'Messages', exact: true })).toContainText('Reference letter')
  await page.getByRole('button', { name: 'Mark reference mail read', exact: true }).click()
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.getByText(/Showing 60 of 61 messages/)).toContainText('0 unread across all mail')
  await expectNoHorizontalScroll(page)
})
