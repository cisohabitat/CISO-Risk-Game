import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

for (const theme of ['light', 'dark']) {
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
