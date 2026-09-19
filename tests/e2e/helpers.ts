import { expect, type Page } from '@playwright/test'

export async function startCampaign(page: Page, seed = 'e2e-seed'): Promise<void> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
  const seedField = page.getByLabel('Campaign seed')
  await seedField.fill(seed)
  await page.getByRole('button', { name: 'Begin your first day' }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible({ timeout: 20_000 })
}

/** Navigate by the visible affordance for this viewport, never by URL. */
export async function goTo(page: Page, label: string): Promise<void> {
  const nav = page.getByRole('navigation', { name: 'Primary' })
  const direct = nav.getByRole('button', { name: label, exact: true })
  if (await direct.first().isVisible().catch(() => false)) {
    await direct.first().click()
    return
  }
  // Secondary destinations live behind "More" on small screens.
  await nav.getByRole('button', { name: 'More' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: label, exact: true }).first().click()
  await expect(dialog).toBeHidden()
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - doc.clientWidth
  })
  expect(overflow, 'page-level horizontal scrolling appeared').toBeLessThanOrEqual(1)
}

/**
 * Returns the labels of any control that is cut off by the viewport.
 *
 * A control inside a deliberately scrollable strip (a filter row, a tab list)
 * is reachable and does not count; one that simply overflows the page does.
 */
export async function offscreenControls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const inScrollableStrip = (element: Element): boolean => {
      let current: Element | null = element.parentElement
      while (current && current !== document.body) {
        const style = getComputedStyle(current)
        const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll'
        if (scrolls && current.scrollWidth > current.clientWidth + 1) return true
        current = current.parentElement
      }
      return false
    }

    const problems: string[] = []
    for (const element of Array.from(document.querySelectorAll('button, a[href], [role="button"]'))) {
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue
      if (inScrollableStrip(element)) continue
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        problems.push((element.textContent ?? element.ariaLabel ?? 'control').trim().slice(0, 40))
      }
    }
    return problems
  })
}
