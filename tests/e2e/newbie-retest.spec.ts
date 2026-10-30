import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('the unread badge and attention list show the work actually waiting', async ({ page }) => {
  const save = prepareCampaign('retest-counts', 'day:1', 'guided') as { state: GameState }
  const state = save.state
  const template = state.inbox.messages[0]!
  state.inbox.messages = Array.from({ length: 82 }, (_, i) => ({ ...template, id: `msg-${1000 + i}`, priority: 'notable', decisionId: undefined, eventId: undefined, read: false }))
  state.inbox.counter = 1082
  for (const defId of ['dec-first-week-focus', 'dec-ceo-three-risks', 'dec-launch-conditions', 'dec-msp-access', 'dec-audit-finding']) {
    if (state.decisions.openIds.some((id) => state.decisions.decisions[id]!.defId === defId)) continue
    const id = `dec-${++state.decisions.counter}`
    state.decisions.decisions[id] = { id, defId, createdDay: state.currentDay, deadlineDay: state.currentDay + 10, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [] }
    state.decisions.openIds.push(id)
  }
  await openPreparedCampaign(page, save)
  const badge = page.locator('[data-testid="inbox-unread-count"]:visible')
  await expect(badge).toContainText('82')
  await expect(page.getByLabel('Attention breakdown')).toContainText('5 open decisions')
  await expect(page.getByRole('button', { name: /^Decide:/ })).toHaveCount(4)
  await page.getByRole('button', { name: 'Show 1 more decision' }).click()
  await expect(page.getByRole('button', { name: /^Decide:/ })).toHaveCount(5)
  await expectNoHorizontalScroll(page)
  await goTo(page, 'Inbox')
  await page.getByRole('list', { name: 'Messages', exact: true }).getByRole('button').first().click()
  await expect(badge).toContainText('81')
  await expectNoHorizontalScroll(page)
})

test('a programme keeps its dated checkpoint separate from later delivery', async ({ page }) => {
  const save = prepareCampaign('retest-checkpoint', 'day:1', 'guided') as { state: GameState }
  const state = save.state
  const id = `dec-${++state.decisions.counter}`
  state.decisions.decisions[id] = { id, defId: 'dec-audit-finding', createdDay: 10, deadlineDay: 20, resolvedDay: 10, selectedOptionId: 'opt-audit-programme', resolvedByDefault: false, rationaleTagIds: ['rat-more-evidence'], assumptionIds: [] }
  state.decisions.resolvedIds.push(id)
  state.currentDay = 280
  const work = state.programmes.programmes['prog-identity']!
  Object.assign(work, { status: 'complete', progress: 1, startedDay: 12, completedDay: 220, budgetAllocated: 850 })
  state.history.entries.push({ day: 110, kind: 'programme-review', refs: ['prog-identity'], summary: 'Identity programme: Under way; 40% delivered. Funding allocated £850k at this checkpoint.' })
  await openPreparedCampaign(page, save)
  const commitments = page.getByRole('region', { name: 'Recorded commitments' })
  await expect(commitments).toContainText('Delivered')
  await expect(commitments).toContainText('Reviewed on')
  await expect(commitments).toContainText('Under way; 40% delivered')
  await expect(commitments).not.toContainText('Review scheduled for')
  await expectNoHorizontalScroll(page)
})

test('commissioning confirms the job and its budget movement', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('retest-commission', 'day:1', 'guided'))
  await goTo(page, 'Risk')
  await page.getByRole('tab', { name: 'Investigate', exact: true }).click()
  await page.getByRole('button', { name: /^Show all .* available enquiries/ }).click()
  await page.getByRole('button', { name: 'Commission: Recovery test for a critical service', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Commission the work', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Commission confirmation' })).toContainText('Recovery test for a critical service commissioned')
  await expect(page.getByRole('heading', { name: 'Work in progress' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await goTo(page, 'Briefing')
  const budget = page.getByRole('button', { name: 'Budget movements', exact: true })
  await budget.click()
  await expect(budget.locator('..').getByText(/Commissioned Recovery test for a critical service: £80k spent or withdrawn/)).toBeVisible()
})

test('the year-end review keeps near-complete recovery below 100 percent', async ({ page }) => {
  const save = prepareCampaign('retest-recovery', 'year-end', 'guided') as { state: GameState }
  const state = save.state
  delete state.reviews.annual
  for (const id of ['prog-identity', 'prog-detection', 'prog-ransomware']) {
    const work = state.programmes.programmes[id]!
    work.startedDay = 1
    work.progress = id === 'prog-ransomware' ? 0.9999 : 1
    work.status = id === 'prog-ransomware' ? 'active' : 'complete'
    if (work.status === 'complete') work.completedDay = 200
    else delete work.completedDay
  }
  await openPreparedCampaign(page, save)
  await expect(page.getByText('How the year is read')).toBeVisible()
  await expect(page.getByText(/2 of 3 programmes you started reached completion/)).toBeVisible()
  await expect(page.getByText('Ransomware resilience and recovery: 99% delivered', { exact: true })).toBeVisible()
  await expect(page.getByText('Ransomware resilience and recovery: 100% delivered', { exact: true })).toHaveCount(0)
  await expectNoHorizontalScroll(page)
})

test('forming a hypothesis confirms the draft and raising it changes the raised count', async ({ page }) => {
  const save = prepareCampaign('retest-pattern', 'pattern', 'guided') as { state: GameState }
  for (const risk of Object.values(save.state.risks.scenarios)) risk.status = 'emerging'
  await openPreparedCampaign(page, save)
  await page.getByRole('button', { name: /^Form the hypothesis/ }).first().click()
  await expect(page.getByRole('status', { name: 'Hypothesis formed' })).toContainText('Draft formed:')
  await page.getByRole('button', { name: 'View working hypotheses', exact: true }).click()
  const counts = page.getByLabel('Risk register counts')
  await expect(counts).toContainText('0 raised')
  await page.getByRole('button', { name: /^Raise as a risk scenario/ }).first().click()
  await page.getByRole('dialog', { name: 'Raise this risk scenario?' }).getByRole('button', { name: /^Raise this risk ·/ }).click()
  await expect(counts).toContainText('1 raised')
  await expect(page.getByRole('button', { name: 'View risk scenario', exact: true })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
