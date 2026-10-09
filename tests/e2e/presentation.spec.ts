import { expect, test } from '@playwright/test'
import { startCampaign } from './helpers'

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
