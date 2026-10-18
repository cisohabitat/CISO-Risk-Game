import { expect, test } from '@playwright/test'
import { beginCampaign, expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('portraits load with people rather than with the start screen', async ({ page }) => {
  const portraits: string[] = []
  const fonts: string[] = []
  const incidents: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('nexora-people')) portraits.push(request.url())
    if (request.url().endsWith('.woff2')) fonts.push(request.url())
    if (request.url().includes('nexora-incidents')) incidents.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
  expect(portraits).toHaveLength(0)
  expect(incidents).toHaveLength(0)
  await page.evaluate(() => document.fonts.ready)
  expect(fonts.length).toBeGreaterThan(0)
  for (const font of fonts) expect(new URL(font).origin).toBe(new URL(page.url()).origin)

  await beginCampaign(page, 'e2e-art')
  await goTo(page, 'Board')
  const executive = page.getByRole('heading', { name: 'Marianne Okafor', exact: true }).locator('..').locator('..')
  const portrait = executive.locator('img')
  await portrait.scrollIntoViewIfNeeded()
  expect((await portrait.locator('..').boundingBox())!.width).toBeGreaterThanOrEqual(80)
  await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await expectNoHorizontalScroll(page)

  await goTo(page, 'Team')
  const leader = page.getByRole('heading', { name: 'Jo Mbeki', exact: true }).locator('..').locator('..').locator('img')
  await leader.scrollIntoViewIfNeeded()
  await expect.poll(() => leader.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  const facts = page.locator('.leader-facts').first()
  const workload = await facts.getByText('Workload', { exact: true }).boundingBox()
  const morale = await facts.getByText('Morale', { exact: true }).boundingBox()
  const record = await facts.getByText('Track record', { exact: true }).boundingBox()
  expect(workload!.y).toBe(morale!.y)
  if (page.viewportSize()!.width < 640) {
    expect(record!.y).toBeGreaterThan(workload!.y)
    expect(record!.x).toBe(workload!.x)
  } else expect(record!.y).toBe(workload!.y)
  // Every portrait uses the same cached atlas, including when changing screens.
  expect(new Set(portraits).size).toBe(1)
  await expectNoHorizontalScroll(page)
})

test('an incident illustration loads beside the factual response journal', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('visual-incident', 'incident'))
  const illustration = page.locator('.incident-art img').first()
  await illustration.scrollIntoViewIfNeeded()
  await expect.poll(() => illustration.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await expect(page.getByText('Latest update', { exact: true })).toBeVisible()
  const journal = page.locator('[role=region][aria-labelledby=incident-command]')
  const history = journal.getByRole('button', { name: /^Earlier updates/ })
  await expect(history).toHaveAttribute('aria-expanded', 'false')
  await history.click()
  await expect(history).toHaveAttribute('aria-expanded', 'true')
  await history.click()
  if (page.viewportSize()!.width < 640) {
    const facts = page.locator('.incident-situation > span')
    const boxes = await Promise.all((await facts.all()).map((fact) => fact.boundingBox()))
    expect(boxes[0]!.y).toBe(boxes[1]!.y)
    if (boxes[2]) expect(boxes[2].y).toBeGreaterThanOrEqual(Math.max(boxes[0]!.y + boxes[0]!.height, boxes[1]!.y + boxes[1]!.height))
  }
  const response = journal.getByRole('button', { name: 'Incident command', exact: true })
  expect(await response.evaluate((element) => Boolean(element.compareDocumentPosition(document.querySelector('.response-timeline')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  expect(await page.locator('.incident-situation').evaluate((element) => Boolean(element.compareDocumentPosition(document.querySelector('.incident-actions')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  await response.click()
  const decision = page.getByRole('dialog', { name: 'Incident command', exact: true })
  await expect(decision).toBeVisible()
  const descriptionId = await decision.getAttribute('aria-describedby')
  await expect(decision.locator('.scroll-area').locator(`[id="${descriptionId}"]`)).toBeVisible()
  await decision.locator('input[type="radio"]:not([disabled])').first().check()
  await expect(decision.getByRole('button', { name: 'Commit to this', exact: true })).toBeInViewport()
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  await expectNoHorizontalScroll(page)
})
