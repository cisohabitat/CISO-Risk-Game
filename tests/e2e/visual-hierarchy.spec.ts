import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('secondary workspaces compact the journal while retaining response decisions', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('visual-incident', 'incident'))
  // Use the labelled region across incident families without guessing its name.
  const response = page.locator('[role=region][aria-labelledby=incident-command]')
  await expect(response.getByRole('button', { name: 'Response journal', exact: true })).toHaveAttribute('aria-expanded', 'true')
  await goTo(page, 'Inbox')
  const toggle = response.getByRole('button', { name: 'Response journal', exact: true })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(response.locator('.incident-actions button').first()).toBeVisible()
  await expect(response.locator('.incident-actions button').first()).toBeEnabled()
  await expect(response.locator('.incident-situation')).toBeVisible()
  const compactHeight = (await response.boundingBox())!.height
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(response.getByText('Latest update', { exact: true })).toBeVisible()
  expect((await response.boundingBox())!.height).toBeGreaterThan(compactHeight + 100)
  await expectNoHorizontalScroll(page)
  await goTo(page, 'Briefing')
  await expect(response.getByRole('button', { name: 'Response journal', exact: true })).toHaveAttribute('aria-expanded', 'true')
})

test('landscape navigation stays visible above folded utilities', async ({ page }, info) => {
  test.skip(!['desktop-chromium', 'desktop-webkit'].includes(info.project.name), 'both browser engines at landscape size')
  await page.setViewportSize({ width: 1180, height: 820 })
  const save = prepareCampaign('visual-navigation', 'day:200') as { state: GameState }
  for (const fn of Object.values(save.state.team.functions)) fn!.morale = 0.2
  await openPreparedCampaign(page, save)
  const rail = page.getByRole('navigation', { name: 'Primary' })
  for (const name of ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board', 'Your year']) {
    const box = (await rail.getByRole('button', { name, exact: true }).boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(820)
    expect(await rail.getByRole('button', { name, exact: true }).evaluate((e) => {
      const b = e.getBoundingClientRect(), parent = e.closest('.sidebar-menu')!.getBoundingClientRect()
      return b.top >= parent.top && b.bottom <= parent.bottom
    })).toBe(true)
  }
  const tools = rail.locator('summary', { hasText: 'Help and settings' })
  await tools.focus()
  await page.keyboard.press('Enter')
  await rail.getByRole('button', { name: 'Glossary', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Glossary' })).toBeVisible()
})

test('wellbeing and executive actions remain prominent with details available', async ({ page }) => {
  const save = prepareCampaign('visual-people', 'day:10') as { state: GameState }
  save.state.team.functions.engineering!.morale = 0.2
  save.state.team.functions.engineering!.committed = 0
  await openPreparedCampaign(page, save)
  await goTo(page, 'Team')
  const fn = page.locator('.function-row').filter({ has: page.getByRole('heading', { name: 'Security engineering', exact: true }) })
  await expect(fn.getByText('Capacity: available', { exact: true })).toBeVisible()
  await expect(fn.getByText('Wellbeing: Burning out', { exact: true })).toBeVisible()
  await goTo(page, 'Board')
  const dossier = page.locator('.person-dossier').first()
  const profile = dossier.getByRole('button', { name: 'Profile and history: Marianne Okafor', exact: true })
  const listen = dossier.getByRole('button', { name: /^Listen:/ })
  await expect(listen).toBeVisible()
  expect(await listen.evaluate((e) => Boolean(e.compareDocumentPosition(e.closest('.person-dossier')!.querySelector('[aria-expanded]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  await expect(profile).toHaveAttribute('aria-expanded', 'false')
  await profile.focus()
  await page.keyboard.press('Enter')
  await expect(dossier.getByText('What they care about', { exact: true })).toBeVisible()
  await expectNoHorizontalScroll(page)
  const audit = await new AxeBuilder({ page }).include('#main').analyze()
  expect(audit.violations.map((v) => v.id)).toEqual([])
})
