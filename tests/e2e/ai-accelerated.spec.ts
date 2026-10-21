import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('the accelerated exploit decision explains uncertainty, costs and all response routes', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('ai-accelerated-ui', 'exploit'))
  await goTo(page, 'Inbox')
  const search = page.getByRole('searchbox', { name: 'Search messages', exact: true })
  await search.fill('Checkout exploit variants')
  await page.getByRole('list', { name: 'Messages' }).getByRole('button').click()
  const reader = page.getByRole('region', { name: 'Message reader' })
  await expect(reader).toContainText('AI-assisted analysis')
  await expect(reader).toContainText('It does not establish')
  await reader.getByRole('button', { name: 'Take the decision', exact: true }).click()
  const paper = page.getByRole('dialog')
  await expect(paper).toContainText('Due in 2 days.')
  await expect(paper.getByRole('radio')).toHaveCount(4)
  await expect(paper).toContainText('SOC capacity until the announced patch window')
  await paper.getByRole('radio', { name: /Restrict the affected route until patching/ }).check()
  await expect(paper).toContainText('Delays platform launch work')
  await paper.getByRole('button', { name: 'Your reasons', exact: true }).click()
  await paper.getByRole('button', { name: 'The consequence is material', exact: true }).click()
  await expect(paper.getByRole('button', { name: 'Commit to this', exact: true })).toBeInViewport()
  await paper.getByRole('button', { name: 'Commit to this', exact: true }).click()
  await expect(paper).toHaveCount(0)
  await expectNoHorizontalScroll(page)
})
