import { expect, test, type Locator, type Page } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

async function expectReachable(control: Locator): Promise<void> {
  // Lazy content can finish sizing after a scroll. Check the final layout,
  // including clipping and hit testing, rather than retain an earlier position.
  await expect(async () => {
    await control.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }))
    await expect(control).toBeInViewport({ timeout: 1_000 })
    const reachable = await control.evaluate((element) => {
      const rect = element.getClientRects()[0]!
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return element.contains(hit)
    })
    expect(reachable, `another surface covers ${await control.textContent()}`).toBe(true)
  }).toPass({ timeout: 15_000 })
}

async function scrollWithWheel(page: Page, surface?: Locator): Promise<void> {
  const main = page.getByRole('main')
  const bounds = await (surface ?? main).boundingBox()
  const distance = await page.evaluate(() => {
    const main = document.getElementById('main')!
    const root = document.documentElement
    return Math.min(400, main.scrollHeight - main.clientHeight + root.scrollHeight - root.clientHeight)
  })
  if (distance <= 2) return
  await page.mouse.move(
    bounds!.x + (surface ? bounds!.width / 2 : 8),
    surface ? bounds!.y + bounds!.height / 2 : Math.min(bounds!.y + 40, page.viewportSize()!.height - 80),
  )
  await page.mouse.wheel(0, distance)
  await expect.poll(() => page.evaluate(() => (document.getElementById('main')?.scrollTop ?? 0) + scrollY)).toBeGreaterThanOrEqual(distance - 1)
}

for (const theme of ['light', 'dark'] as const) {
  test(`all main screens scroll, expose their final control and reset on navigation, ${theme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.emulateMedia({ colorScheme: theme })
    await page.addInitScript((value) => localStorage.setItem('ciso-theme', value), theme)
    await openPreparedCampaign(page, prepareCampaign('scroll-audit', 'day:200'))
    for (const name of ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board', 'Your year']) {
      await goTo(page, name)
      const main = page.getByRole('main', { name, exact: true })
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible()
      await expect.poll(() => page.evaluate(() => (document.getElementById('main')?.scrollTop ?? 0) + scrollY)).toBeLessThanOrEqual(1)
      await expectNoHorizontalScroll(page)
      // Horizontal filters must let vertical input reach the page or main pane.
      const filters = name === 'Inbox'
        ? main.getByRole('group', { name: 'Filter messages' })
        : name === 'Organisation'
          ? main.getByRole('button', { name: 'Everything', exact: true }).locator('..')
          : undefined
      await scrollWithWheel(page, filters)
      const controls = main.locator('button:visible:not([disabled]), a[href]:visible, summary:visible')
      if (await controls.count()) await expectReachable(controls.last())
    }
  })
}

test('a short desktop rail stays reachable with every function struggling', async ({ page }, info) => {
  test.skip(!['desktop-chromium', 'desktop-webkit'].includes(info.project.name), 'desktop rail only')
  await page.setViewportSize({ width: 1366, height: 480 })
  const save = prepareCampaign('scroll-audit', 'day:200') as { state: GameState }
  for (const fn of Object.values(save.state.team.functions)) fn!.morale = 0.2
  await openPreparedCampaign(page, save)
  const rail = page.getByRole('navigation', { name: 'Primary' }).first()
  for (const name of ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board', 'Your year', 'Glossary']) {
    await expectReachable(rail.getByRole('button', { name, exact: true }))
  }
  await expectReachable(rail.getByRole('button', { name: 'Shortcut keys on', exact: true }))
  await expectReachable(rail.getByRole('button', { name: 'Briefing', exact: true }))
  await rail.getByRole('button', { name: 'Briefing', exact: true }).click()
  await expect(page.getByRole('main', { name: 'Briefing', exact: true })).toBeVisible()
})
