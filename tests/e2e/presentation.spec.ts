import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, goTo, startCampaign } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'
import type { GameState } from '../../src/game/types'

/**
 * Phase 3 of docs/ROADMAP.md: sound is silent until asked for, and motion
 * stops when the player's system asks for none.
 */
test('sound makes no audio until the player turns it on', async ({ page }) => {
  await page.addInitScript(() => {
    const counted = window as unknown as { audioContexts: number; AudioContext: typeof AudioContext }
    counted.audioContexts = 0
    const Real = window.AudioContext
    counted.AudioContext = class extends Real {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args)
        counted.audioContexts += 1
      }
    }
  })
  await startCampaign(page, 'e2e-sound')
  await page.getByRole('button', { name: 'Skip ahead' }).click()
  expect(await page.evaluate(() => (window as unknown as { audioContexts: number }).audioContexts)).toBe(0)

  const width = page.viewportSize()?.width ?? 1280
  if (width < 1024) await page.getByRole('button', { name: 'More' }).click()
  else await page.locator('summary', { hasText: 'Help and settings' }).click()
  const toggle = page.getByTestId('sound-toggle').filter({ visible: true })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioContexts: number }).audioContexts)).toBeGreaterThan(0)
})

test('motion stops when the system asks for none', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startCampaign(page, 'e2e-motion')
  const durations = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.animate-rise, .animate-pop, .animate-arrive')).map((element) =>
      parseFloat(getComputedStyle(element).animationDuration),
    ),
  )
  expect(durations.length).toBeGreaterThan(0)
  for (const duration of durations) expect(duration).toBeLessThan(0.01)
})

test('the annual cover and choice highlights reflect the recorded year', async ({ page }) => {
  const save = prepareCampaign('review-moments', 'year-end') as { state: GameState }
  await openPreparedCampaign(page, save)
  const cover = page.locator('.report-cover')
  await expect(cover.getByText('At the close', { exact: true })).toBeVisible()
  const sections = page.getByRole('navigation', { name: 'Annual review sections' })
  await sections.getByRole('link', { name: 'Assessment', exact: true }).click()
  await expect(page.locator('#dimensions')).toBeFocused()
  await expect(page.locator('#dimensions')).toBeInViewport()
  await sections.getByRole('link', { name: 'Year timeline', exact: true }).click()
  await expect(page.locator('#the-year')).toBeInViewport()
  await expect(page.getByRole('list', { name: 'Timeline marker key' })).toContainText('Lapsed decision')
  await expectNoHorizontalScroll(page)
  const moments = page.getByRole('region', { name: 'Choices from your year', exact: true })
  await expect(moments.locator('ol > li')).toHaveCount(3)
  await expect(moments.getByRole('heading', { name: 'Where do you start?', exact: true })).toBeVisible()
  await expect(moments).toContainText('You chose: Start with the business services')
  // The highlights summarise real judgements, not a newly invented score.
  const log = page.getByRole('region', { name: 'The judgements you made', exact: true })
  await expect(log).toBeVisible()
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible()

  // Older saves may have a review without a full decision log. Do not invent
  // highlights to fill the layout, or repeat the same choice three times.
  save.state.history.decisionsLog = save.state.history.decisionsLog.slice(0, 1)
  await openPreparedCampaign(page, save)
  await expect(moments.locator('ol > li')).toHaveCount(1)
  save.state.history.decisionsLog = []
  await openPreparedCampaign(page, save)
  await expect(moments).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'How the year is read', exact: true })).toBeVisible()
})


test('the board paper keeps context scrollable and its dates distinct', async ({ page }) => {
  await openPreparedCampaign(page, prepareCampaign('guide-3', 'board'))
  await goTo(page, 'Board')
  const note = page.getByRole('button', { name: 'Got it', exact: true })
  if (await note.isVisible()) await note.click()
  await page.getByRole('button', { name: /Prepare the Q1 board paper/ }).click()
  const paper = page.getByRole('dialog', { name: 'Board paper: quarter 1', exact: true })
  const description = await paper.getAttribute('aria-describedby')
  await expect(paper.locator('.scroll-area').locator(`[id="${description}"]`)).toBeVisible()
  await expect(paper.locator('.paper-dates dt')).toHaveText(['Reporting period', 'Prepared', 'Submit by'])
  await expect(paper.locator('.paper-dates dd')).toHaveText(['Q1 results · presented in Q2', '2 April', '1 July'])
  await paper.getByRole('heading', { name: 'Your submission' }).scrollIntoViewIfNeeded()
  await expect(paper.getByRole('button', { name: 'Close', exact: true })).toBeInViewport()
  await expect(paper.getByRole('button', { name: 'Take it to the board', exact: true })).toBeInViewport()
  await expectNoHorizontalScroll(page)
})
