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
        : name === 'Risk'
          ? main.getByRole('tablist', { name: 'Risk workspace' })
        : name === 'Organisation'
          ? main.getByRole('combobox', { name: 'System type' }).locator('..')
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
  for (const name of ['Briefing', 'Inbox', 'Risk', 'Organisation', 'Programmes', 'Team', 'Board', 'Your year']) {
    await expectReachable(rail.getByRole('button', { name, exact: true }))
  }
  await rail.locator('summary', { hasText: 'Help and settings' }).click()
  await expectReachable(rail.getByRole('button', { name: 'Glossary', exact: true }))
  await expectReachable(rail.getByRole('button', { name: 'Shortcut keys on', exact: true }))
  await expectReachable(rail.getByRole('button', { name: 'Briefing', exact: true }))
  await rail.getByRole('button', { name: 'Briefing', exact: true }).click()
  await expect(page.getByRole('main', { name: 'Briefing', exact: true })).toBeVisible()
})

for (const width of [1024, 1366]) {
  test(`split workspaces scroll independently at ${width}px`, async ({ page }, info) => {
    test.skip(!['desktop-chromium', 'desktop-webkit'].includes(info.project.name), 'wheel isolation in both browser engines')
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 768 })
    const save = prepareCampaign('scroll-audit', 'day:200') as { state: GameState }
    // Exercise a long reader as well as a long message list.
    for (const message of save.state.inbox.messages.slice(0, 2)) message.body = Array(12).fill(message.body).join('\n\n')
    await openPreparedCampaign(page, save)
    for (const name of ['Inbox', 'Risk', 'Organisation']) {
      await goTo(page, name)
      if (name === 'Organisation') await page.getByRole('button', { name: 'List', exact: true }).click()
      const panes = page.locator('.split-workspace > .split-pane')
      await expect(panes).toHaveCount(2)
      const left = panes.nth(0), right = panes.nth(1)
      for (const pane of [left, right]) {
        const bounds = (await pane.boundingBox())!
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(768)
      }
      const choices = name === 'Organisation' ? left.getByRole('list', { name: 'Discovered systems' }).getByRole('button') : left.getByRole('button')
      await choices.first().click()
      const heading = page.getByRole('main').getByRole('heading', { level: 1 })
      const headingY = (await heading.boundingBox())!.y
      const scroll = (pane: Locator) => pane.evaluate((element) => element.scrollTop)
      const wheel = async (pane: Locator, delta: number) => {
        const box = (await pane.boundingBox())!
        await page.mouse.move(box.x + box.width / 2, box.y + Math.min(100, box.height / 2))
        await page.mouse.wheel(0, delta)
      }
      await wheel(left, 350)
      await expect.poll(() => scroll(left)).toBe(350)
      expect(await scroll(right)).toBe(0)
      const leftPosition = await scroll(left)
      const readerDistance = await right.evaluate((element) => Math.min(300, element.scrollHeight - element.clientHeight))
      await wheel(right, 300)
      await expect.poll(() => scroll(right)).toBe(readerDistance)
      expect(await scroll(left)).toBe(leftPosition)
      expect(await page.locator('#main').evaluate((element) => element.scrollTop)).toBe(0)
      expect((await heading.boundingBox())!.y).toBe(headingY)
      // At the end of either panel, further wheel input must not move its neighbour.
      await right.evaluate((element) => { element.scrollTop = element.scrollHeight })
      await wheel(right, 500)
      await expect.poll(() => scroll(left)).toBe(leftPosition)
      await choices.nth(1).click()
      await expect.poll(() => scroll(right)).toBe(0)
      await expectNoHorizontalScroll(page)
      const controls = right.locator('button:visible:not([disabled]), a[href]:visible')
      if (await controls.count()) await expectReachable(controls.last())
    }
    // Rotating back restores the existing stacked organisation flow.
    await page.setViewportSize({ width: 834, height: 1112 })
    await expect.poll(() => page.locator('.split-workspace > .split-pane').first().evaluate((element) => getComputedStyle(element).overflowY)).toBe('visible')
    await expectNoHorizontalScroll(page)
  })
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1180, height: 820 }]) {
  test(`incident banners preserve usable split panes at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    test.skip(!['desktop-chromium', 'desktop-webkit'].includes(info.project.name), 'both engines at the reported landscape sizes')
    test.setTimeout(120_000)
    await page.setViewportSize(viewport)
    const save = prepareCampaign('incident-banner-scroll', 'incident') as { state: GameState }
    for (const message of save.state.inbox.messages) message.body = Array(10).fill(message.body).join('\n\n')
    await openPreparedCampaign(page, save)
    // Create the real receipt via the decision UI. Keep both it and guidance
    // present: dismissing them concealed the zero-height reader regression.
    await page.getByRole('button', { name: /^Decide:/ }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio').filter({ visible: true }).first().check()
    await dialog.getByRole('region', { name: /^Why\?/ }).getByRole('button').first().click()
    await dialog.getByRole('button', { name: 'Commit to this', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Dismiss decision receipt', exact: true })).toBeVisible()

    for (const name of ['Inbox', 'Risk', 'Organisation']) {
      await goTo(page, name)
      if (name === 'Organisation') await page.getByRole('button', { name: 'List', exact: true }).click()
      const panes = page.locator('.split-workspace > .split-pane')
      await expect(panes).toHaveCount(2)
      const left = panes.nth(0), right = panes.nth(1)
      await expect.poll(() => left.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(300)
      await expect.poll(() => right.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(300)
      const choices = name === 'Organisation' ? left.getByRole('list', { name: 'Discovered systems' }).getByRole('button') : left.getByRole('button')
      await choices.first().click()
      if (name === 'Inbox') {
        await choices.last().click()
        await expect(page.getByRole('region', { name: 'Message reader', exact: true }).getByRole('heading', { level: 2 })).toBeVisible()
        await choices.first().click()
      }
      await left.evaluate((element) => { element.scrollTop = 0 })
      await left.scrollIntoViewIfNeeded()
      const bounds = (await left.boundingBox())!
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      const listDistance = await left.evaluate((element) => Math.min(150, element.scrollHeight - element.clientHeight))
      await page.mouse.wheel(0, 150)
      await expect.poll(() => left.evaluate((element) => element.scrollTop)).toBe(listDistance)
      expect(await right.evaluate((element) => element.scrollTop)).toBe(0)
      const position = await left.evaluate((element) => element.scrollTop)
      await right.scrollIntoViewIfNeeded()
      const reader = (await right.boundingBox())!
      await page.mouse.move(reader.x + reader.width / 2, reader.y + reader.height / 2)
      await page.mouse.wheel(0, 150)
      const distance = await right.evaluate((element) => Math.min(150, element.scrollHeight - element.clientHeight))
      await expect.poll(() => right.evaluate((element) => element.scrollTop)).toBe(distance)
      expect(await left.evaluate((element) => element.scrollTop)).toBe(position)
      const controls = right.locator('button:visible:not([disabled]), a[href]:visible')
      if (await controls.count()) await expectReachable(controls.last())
      await expectNoHorizontalScroll(page)
    }
  })
}
