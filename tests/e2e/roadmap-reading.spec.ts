import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo, startCampaign } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('the Briefing names paused work, its next milestone and expected enquiry returns', async ({ page }) => {
  await startCampaign(page, 'quiet-work-visibility')
  await goTo(page, 'Programmes')
  await page.getByRole('button', { name: /^Start this/ }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Start the programme', exact: true }).click()
  await page.locator('.programme-row').first().getByRole('button', { name: 'Pause', exact: true }).click()
  await goTo(page, 'Risk')
  await page.getByRole('tab', { name: 'Investigate', exact: true }).click()
  await page.getByRole('button', { name: 'Commission: Critical business service review', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Commission the work', exact: true }).click()
  await goTo(page, 'Briefing')
  const capability = page.getByRole('region', { name: 'Capability you are building', exact: true })
  await expect(capability.getByText('Paused', { exact: true })).toBeVisible()
  await expect(capability).toContainText('Delivery is paused. Review staffing and blockers in Programmes before resuming.')
  await expect(capability.getByText(/^Next milestone:/)).toBeVisible()
  const team = page.getByRole('region', { name: 'Your team', exact: true })
  await expect(team).toContainText('Critical business service review')
  await expect(team).toContainText(/Around \d+ [A-Z][a-z]{2}/)
  await expectNoHorizontalScroll(page)
})

test('Inbox search reaches older mail without reading transient search results', async ({ page }) => {
  const save = prepareCampaign('roadmap-search', 'year-end') as { state: GameState }
  save.state.inbox.messages = Array.from({ length: 130 }, (_, i) => ({
    id: `search-mail-${i}`, day: 130 - i, from: 'Sentinel SOC',
    subject: i === 120 ? 'Completed: Supplier review' : `Routine review ${i}`,
    body: i === 120 ? 'The Kestrel contract findings are available.' : 'The routine report is available.',
    type: 'business', priority: 'routine', read: false, pinned: false, relatedNodeIds: [],
  }))
  await openPreparedCampaign(page, save)
  await goTo(page, 'Inbox')
  const search = page.getByRole('searchbox', { name: 'Search messages', exact: true })
  const list = page.getByRole('list', { name: 'Messages' })
  await search.fill('ROUTINE 129')
  await expect(list.getByRole('button')).toHaveCount(1)
  await expect(list.locator('.message-sender')).toHaveClass(/font-semibold/)
  await expect(page.getByRole('heading', { name: 'Routine review 129', exact: true })).toHaveCount(0)
  await expect(page.locator('#message-reader')).toHaveCount(1)
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations).toEqual([])
  await search.fill('kestrel sentinel')
  await expect(list.getByRole('button')).toHaveCount(1)
  await expect(list.locator('.message-sender')).toHaveClass(/font-semibold/)
  await list.getByRole('button').click()
  await expect(page.getByRole('heading', { name: 'Completed: Supplier review', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Message reader' })).toContainText('Enquiry returned')
  await expect(list.locator('.message-sender')).not.toHaveClass(/font-semibold/)
  if (page.viewportSize()!.width < 768) {
    await page.getByRole('button', { name: 'Back to messages', exact: true }).first().click()
    await expect(list.getByRole('button')).toBeFocused()
  }
  await page.getByRole('button', { name: 'Unread', exact: true }).click()
  await expect(page.getByText('No messages match this search in the selected filter.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await search.fill('routine 129')
  await expect(list.getByRole('button')).toHaveCount(1)
  await expect(list.locator('.message-sender')).toHaveClass(/font-semibold/)
  await expectNoHorizontalScroll(page)
})

test('replay links retain free-text campaign seeds as text', async ({ page }) => {
  const seed = `risk review 新加坡 <script> & ? # / + ${'x'.repeat(65)}`
  await page.goto(`/?${new URLSearchParams({ seed, mode: 'high-pressure', situation: 'sit-after-breach' })}`)
  await expect(page.getByRole('textbox', { name: 'Campaign seed', exact: true })).toHaveValue(seed)
  await expect(page.getByTestId('shared-year')).toContainText(seed)
  await expect(page.getByRole('radio', { name: /High pressure/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /After the breach/ })).toBeChecked()
})

test('the annual review reveals earlier judgements and preserves replay setup', async ({ page }) => {
  const save = prepareCampaign('roadmap-review', 'year-end') as { state: GameState }
  expect(save.state.history.decisionsLog.length).toBeGreaterThan(14)
  await openPreparedCampaign(page, save)
  const judgements = page.getByRole('list', { name: 'Recorded judgements', exact: true })
  await expect(judgements.getByRole('listitem')).toHaveCount(14)
  await page.getByRole('button', { name: 'Show earlier judgements', exact: true }).click()
  await expect(judgements.getByRole('listitem')).toHaveCount(Math.min(28, save.state.history.decisionsLog.length))
  await expect(judgements.getByRole('listitem').nth(14)).toBeFocused()
  await expect(judgements.getByRole('listitem').nth(14)).toBeInViewport()
  const replay = page.getByRole('link', { name: 'Replay this starting world (new tab)', exact: true })
  const replayUrl = new URL((await replay.getAttribute('href'))!)
  expect(replayUrl.searchParams.get('seed')).toBe(save.state.seed)
  expect(replayUrl.searchParams.get('mode')).toBe(save.state.difficulty)
  expect(replayUrl.searchParams.get('situation')).toBe(save.state.situationId ?? null)
  const [fresh] = await Promise.all([page.waitForEvent('popup'), replay.click()])
  await expect(fresh.getByRole('heading', { name: 'CISO: First Year', exact: true })).toBeVisible()
  await expect(fresh.getByRole('textbox', { name: 'Campaign seed', exact: true })).toHaveValue(save.state.seed)
  await expect(page.getByRole('list', { name: 'Recorded judgements', exact: true })).toBeVisible()
  await fresh.close()
  await expectNoHorizontalScroll(page)
})

test('decision shortcuts reach options and reasons without losing the fixed actions', async ({ page }) => {
  await startCampaign(page, 'roadmap-reading')
  await page.getByRole('button', { name: /^Decide: / }).first().click()
  const paper = page.getByRole('dialog')
  await expect(paper).toContainText('Choose an option to continue')
  await paper.getByRole('button', { name: 'Compare options', exact: true }).click()
  await expect(paper.locator('#decision-options')).toBeFocused()
  await expect(paper.locator('#decision-options')).toBeInViewport()
  await paper.getByRole('radio').first().check()
  await paper.getByRole('button', { name: 'Your reasons', exact: true }).click()
  await expect(paper.locator('#decision-why')).toBeFocused()
  await expect(paper.locator('#decision-why')).toBeInViewport()
  await expect(paper.getByRole('button', { name: 'Commit to this', exact: true })).toBeInViewport()
  const body = paper.locator('.scroll-area')
  await body.hover()
  await page.mouse.wheel(0, 1500)
  await expect(paper.getByRole('button', { name: 'Close', exact: true })).toBeInViewport()
  await expect(paper.getByRole('button', { name: 'Commit to this', exact: true })).toBeInViewport()
  await expectNoHorizontalScroll(page)
})

test('older correspondence stays reachable and Follow-ups retains read messages', async ({ page }) => {
  const save = prepareCampaign('roadmap-mail', 'year-end') as { state: GameState }
  save.state.inbox.messages = Array.from({ length: 130 }, (_, i) => ({
    id: `roadmap-mail-${i}`, day: 130 - i, from: 'Sentinel SOC',
    subject: i === 5 || i === 120 ? `Completed: Review ${i}` : `Routine review ${i}`,
    body: 'The review is available.\n\nRead the findings before deciding your next step.',
    type: 'business', priority: 'routine', read: false, pinned: false, relatedNodeIds: [],
  }))
  await openPreparedCampaign(page, save)
  await expect(page.getByText('How the year is read', { exact: true })).toBeVisible()
  await goTo(page, 'Inbox')
  const list = page.getByRole('list', { name: 'Messages' })
  await expect(list.getByRole('button')).toHaveCount(60)
  await page.getByRole('button', { name: 'Show older messages', exact: true }).click()
  await expect(list.getByRole('button')).toHaveCount(120)
  await expect(list.locator('[data-message-id="roadmap-mail-60"]')).toBeFocused()
  await page.getByRole('button', { name: 'Show older messages', exact: true }).click()
  await expect(list.getByRole('button')).toHaveCount(130)
  await expect(page.getByRole('button', { name: 'Show older messages', exact: true })).toHaveCount(0)
  const oldest = list.locator('[data-message-id="roadmap-mail-129"]')
  await oldest.click()
  await expect(page.getByRole('heading', { name: 'Routine review 129', exact: true })).toBeVisible()
  await goTo(page, 'Risk')
  await goTo(page, 'Inbox')
  await expect(oldest).toHaveAttribute('aria-current', 'true')
  if (page.viewportSize()!.width < 768) {
    await page.getByRole('button', { name: 'Back to messages', exact: true }).first().click()
    await expect(oldest).toBeFocused()
    await expect(oldest).toBeInViewport()
  }
  await page.getByRole('button', { name: 'Follow-ups', exact: true }).click()
  await expect(list.getByRole('button')).toHaveCount(2)
  await list.getByRole('button').last().click()
  await expect(page.getByRole('heading', { name: 'Completed: Review 120', exact: true })).toBeVisible()
  await expect(list.getByRole('button')).toHaveCount(2)
  await expectNoHorizontalScroll(page)
})
