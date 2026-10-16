import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

for (const theme of ['light', 'dark']) {
  test(`reported second seed keeps a selected threat stable in Unread, ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('ciso-theme', value), theme)
    // Same seed, engine-played choices: the review did not supply its save.
    const save = prepareCampaign('kestrel-32734', 'year-end') as { state: GameState }
    // The preparation driver clears mail daily. Stage an unread backlog of
    // its real retained messages, rather than assuming those flags match play.
    for (const message of save.state.inbox.messages) message.read = false
    await openPreparedCampaign(page, save)
    // A prepared save has reached the last day; its annual review still loads
    // asynchronously. Wait for that automatic navigation before opening mail.
    await expect(page.getByText('How the year is read', { exact: true })).toBeVisible()
    await goTo(page, 'Inbox')
    const list = page.getByRole('list', { name: 'Messages' })
    await page.getByRole('button', { name: 'Threat', exact: true }).click()
    await list.getByRole('button').last().click()
    for (const previous of ['Threat', 'All']) {
      await page.getByRole('button', { name: previous, exact: true }).click()
      await page.getByRole('button', { name: 'Unread', exact: true }).click()
      await expect(list).toBeVisible()
      const count = await list.getByRole('button').count()
      expect(count).toBeGreaterThan(1)
      await list.getByRole('button').nth(1).click()
      await expect(list.getByRole('button')).toHaveCount(count)
      await expect(page.getByText('This screen could not be shown', { exact: true })).toHaveCount(0)
    }
    await expectNoHorizontalScroll(page)
  })

  for (const empty of [false, true]) {
    test(`year-end Unread preserves the backlog, ${theme}, empty=${empty}`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('ciso-theme', value), theme)
      const save = prepareCampaign('nexora-48260', 'year-end') as { state: GameState }
      save.state.inbox.messages = Array.from({ length: 120 }, (_, i) => ({
        id: `audit-mail-${i}`, day: i, from: 'Sentinel SOC', subject: `Audit signal ${i}`,
        body: `Audit message ${i}`, type: 'threat', priority: 'routine', read: empty,
        pinned: false, relatedNodeIds: [],
      }))
      await openPreparedCampaign(page, save)
      await expect(page.getByText('How the year is read', { exact: true })).toBeVisible()
      await goTo(page, 'Inbox')
      const list = page.getByRole('list', { name: 'Messages' })
      for (const previous of ['All', 'Threat']) {
        await page.getByRole('button', { name: previous, exact: true }).click()
        await page.getByRole('button', { name: 'Unread', exact: true }).click()
        if (empty) {
          await expect(page.getByText('Nothing here', { exact: true })).toBeVisible()
          await page.getByRole('button', { name: 'Show all messages' }).click()
        } else {
          await expect(list.getByRole('button')).toHaveCount(60)
          const next = previous === 'All' ? 2 : 4
          await list.getByRole('button', { name: new RegExp(`Audit signal ${next} `) }).click()
          await expect(page.getByRole('heading', { name: `Audit signal ${next}`, exact: true })).toBeVisible()
          await expect(list.getByRole('button')).toHaveCount(60)
        }
        await expect(page.getByText('This screen could not be shown', { exact: true })).toHaveCount(0)
      }
      await expectNoHorizontalScroll(page)
    })
  }
}
