import { expect, test } from '@playwright/test'
import { goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

/**
 * Phase 3 of docs/ROADMAP.md: the annual review is the document a player
 * might take to their own board, so it prints as one — on white, without the
 * game around it, and all of it, not the screenful the scrolling shell shows.
 */
test('the annual review prints as a document', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'PDF output is chromium only')
  test.setTimeout(120_000)
  await page.emulateMedia({ colorScheme: 'dark' })
  await openPreparedCampaign(page, prepareCampaign('e2e-print', 'year-end'))
  await goTo(page, 'Your year')
  // The review loads on demand; print it once it is there.
  await expect(page.getByRole('heading', { name: 'How the year is read' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible()

  await page.emulateMedia({ media: 'print', colorScheme: 'dark' })
  // The game around the review goes; the review stays.
  await expect(page.locator('header[data-print="hide"]')).toBeHidden()
  for (const nav of await page.getByRole('navigation', { name: 'Primary' }).all()) await expect(nav).toBeHidden()
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Black on white even from the dark theme.
  const colours = await page.evaluate(() => {
    const main = document.getElementById('main')!
    const badge = Array.from(document.querySelectorAll('#main .rounded-full')).find((element) => element.textContent?.trim() === 'strong' || element.textContent?.trim() === 'weak' || element.textContent?.trim() === 'developing')
    return {
      ink: getComputedStyle(main).color,
      paper: getComputedStyle(document.body).backgroundColor,
      overflow: getComputedStyle(main).overflowY,
      badge: badge ? getComputedStyle(badge).backgroundColor : null,
    }
  })
  expect(colours.ink).toBe('rgb(0, 0, 0)')
  // A rating keeps a light pill on paper, not the dark theme's. Chromium
  // reports it as rgb(), lab() or oklch() depending on how it was mixed.
  expect(colours.badge, 'no rating badge found').not.toBeNull()
  const [first, second, third] = (colours.badge!.match(/[\d.]+/g) ?? []).map(Number)
  const light = colours.badge!.startsWith('lab')
    ? first! > 85
    : colours.badge!.startsWith('oklch') || colours.badge!.startsWith('oklab')
      ? first! > 0.85
      : Math.min(first!, second!, third!) > 200
  expect(light, `rating badge printed as ${colours.badge}`).toBe(true)
  expect(colours.paper).toBe('rgb(255, 255, 255)')
  // Not clipped to one screenful by the shell's scrolling box.
  expect(colours.overflow).toBe('visible')

  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
  expect(pages, 'the whole review, not one screenful').toBeGreaterThan(2)
  await testInfo.attach('annual-review.pdf', { body: pdf, contentType: 'application/pdf' })
})
