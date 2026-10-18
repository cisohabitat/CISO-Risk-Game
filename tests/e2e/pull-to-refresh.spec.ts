import { expect, test } from '@playwright/test'
import { startCampaign } from './helpers'

test('gameplay guards the refresh edge without trapping page or dialog scrolling', async ({ page, browserName }, info) => {
  await startCampaign(page, 'refresh-guard')
  await expect(page.locator('html')).toHaveAttribute('data-gameplay-scroll', 'true')
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).overscrollBehaviorY)).toBe('none')
  if (browserName === 'chromium' && ['phone', 'phone-320'].includes(info.project.name)) {
    const cdp = await page.context().newCDPSession(page)
    const swipe = async (startY: number, endY: number) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: startY }] })
      for (let step = 1; step <= 12; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150, y: startY + (endY - startY) * step / 12 }] })
        await page.waitForTimeout(20)
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    await page.evaluate(() => scrollTo(0, 0))
    await swipe(600, 300)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100)
    await page.evaluate(() => scrollTo(0, 150))
    await swipe(300, 450)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(100)
    await cdp.detach()
  }
  await page.getByRole('button', { name: /^Decide: / }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const body = dialog.locator('.scroll-area')
  // Real browser cancellation semantics in both engines; browser chrome itself
  // cannot be asserted by Playwright, and physical iPhone validation is separate.
  const result = await body.evaluate((element) => {
    const gesture = (y: number, type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'touches', { value: [{ clientX: 100, clientY: y }] })
      element.dispatchEvent(event)
      return event.defaultPrevented
    }
    document.scrollingElement!.scrollTop = 0
    element.scrollTop = 100
    const scrollable = element.scrollTop > 0
    gesture(100, 'touchstart')
    const whileScrollable = gesture(140, 'touchmove')
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) ancestor.scrollTop = 0
    gesture(100, 'touchstart')
    const atEdge = gesture(140, 'touchmove')
    const upward = gesture(80, 'touchmove')
    element.dispatchEvent(new Event('touchend', { bubbles: true }))
    return { scrollable, whileScrollable, atEdge, upward }
  })
  if (result.scrollable) expect(result.whileScrollable).toBe(false)
  expect(result.atEdge).toBe(true)
  expect(result.upward).toBe(false)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Save and close this campaign' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-gameplay-scroll', 'true')
})
